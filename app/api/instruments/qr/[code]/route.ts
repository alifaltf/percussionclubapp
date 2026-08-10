import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getInstrumentByCodeForAdmin } from "@/lib/supabase/instruments";
import { generateInstrumentQrPngBuffer } from "@/lib/qr";
import { INSTRUMENT_CODE_PATTERN } from "@/types/instrument";

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * Admin-only "Download QR" endpoint — streams a freshly generated PNG,
 * never persisted anywhere. Role is verified server-side against the
 * `profiles` table via getCurrentUser() on every request; this never
 * trusts a client-side admin check.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { profile } = await getCurrentUser();
  if (profile?.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { code: rawCode } = await params;

  let code: string;
  try {
    code = decodeURIComponent(rawCode).trim().toLowerCase();
  } catch {
    return new NextResponse("Invalid instrument code", { status: 400 });
  }

  if (!INSTRUMENT_CODE_PATTERN.test(code)) {
    return new NextResponse("Invalid instrument code", { status: 400 });
  }

  let instrument;
  try {
    instrument = await getInstrumentByCodeForAdmin(code);
  } catch {
    return new NextResponse("Could not load this instrument.", { status: 500 });
  }
  if (!instrument) {
    return new NextResponse("Instrument not found", { status: 404 });
  }

  let png: Buffer;
  try {
    png = await generateInstrumentQrPngBuffer(instrument.instrument_code);
  } catch {
    return new NextResponse("Could not generate QR code", { status: 500 });
  }

  // instrument.instrument_code is already validated against
  // INSTRUMENT_CODE_PATTERN ([a-z0-9_]+ only) both when instruments are
  // created/edited and again above, so it can never contain path
  // separators, quotes, or anything else that would need escaping in a
  // Content-Disposition filename — never build this from raw request input.
  const filename = `${instrument.instrument_code}-qr.png`;

  // Buffer's `ArrayBufferLike` backing type isn't directly assignable to
  // BlobPart under this TS lib config (SharedArrayBuffer vs ArrayBuffer) —
  // copying into a plain Uint8Array sidesteps that without changing the
  // actual bytes returned.
  const pngBytes = Uint8Array.from(png);

  return new NextResponse(new Blob([pngBytes]), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Gated behind an admin session, but the QR image itself is
      // deterministic for a given code — cache privately (this browser
      // only) rather than `no-store`, and never `public`, so a shared
      // cache/proxy in between can't hand it to a non-admin.
      "Cache-Control": "private, max-age=3600, must-revalidate",
    },
  });
}
