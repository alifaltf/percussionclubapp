import QRCode from "qrcode";
import { getSiteUrl } from "@/lib/site-url";
import { INSTRUMENT_CODE_PATTERN } from "@/types/instrument";

/**
 * QR generation lives here, deliberately separate from
 * lib/supabase/instruments.ts — this module only turns a known-valid
 * instrument code into a URL/QR image. It never touches the database.
 */

// Black on white: reliable scanning and printing, and keeps the QR itself
// free of any branding that could interfere with readability.
const QR_DARK_COLOR = "#000000";
const QR_LIGHT_COLOR = "#FFFFFF";
// `margin` is in "modules" (QR blocks), not pixels — 4 is the minimum the
// QR spec recommends for a reliable quiet zone.
const QR_QUIET_ZONE_MODULES = 4;

export class InvalidInstrumentCodeError extends Error {
  constructor(code: string) {
    super(`Invalid instrument code: ${code}`);
    this.name = "InvalidInstrumentCodeError";
  }
}

/**
 * Builds the canonical, absolute URL a QR code should encode for a given
 * instrument code. Throws on a malformed code so a bad code can never
 * silently end up embedded in a generated QR image.
 */
export function buildInstrumentUrl(code: string): string {
  if (!INSTRUMENT_CODE_PATTERN.test(code)) {
    throw new InvalidInstrumentCodeError(code);
  }
  return `${getSiteUrl()}/i/${encodeURIComponent(code)}`;
}

/**
 * Renders the QR as an inline SVG markup string — safe to embed directly
 * (this is generated output, not user-supplied SVG). Used for on-page
 * "View QR" and printable labels, so the QR that gets printed scales
 * losslessly at any label size.
 */
export async function generateInstrumentQrSvg(code: string): Promise<string> {
  const url = buildInstrumentUrl(code);
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: QR_QUIET_ZONE_MODULES,
    color: { dark: QR_DARK_COLOR, light: QR_LIGHT_COLOR },
  });
}

/**
 * Renders the QR as a PNG buffer, for the "Download QR" endpoint. Not
 * persisted anywhere — generated fresh per request and streamed straight
 * back to the client.
 */
export async function generateInstrumentQrPngBuffer(code: string): Promise<Buffer> {
  const url = buildInstrumentUrl(code);
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: QR_QUIET_ZONE_MODULES,
    width: 640,
    color: { dark: QR_DARK_COLOR, light: QR_LIGHT_COLOR },
  });
}
