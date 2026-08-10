import { generateInstrumentQrSvg } from "@/lib/qr";

interface InstrumentQrLabelProps {
  clubName: string;
  instrumentName: string;
  instrumentCode: string;
}

/**
 * The printable instrument label — reused by both the single-instrument
 * print page (/admin/instruments/[id]/qr) and the bulk print page
 * (/admin/instruments/qr-labels) so the two never drift apart. Deliberately
 * black-and-white and free of any decoration inside/around the QR itself
 * (no club logo overlay) to keep the code reliably scannable at small
 * print sizes. Contains only what the module spec allows: club name, QR,
 * instrument name, instrument_code, and a short instruction — never
 * member, borrowing, or database-id information.
 */
export default async function InstrumentQrLabel({
  clubName,
  instrumentName,
  instrumentCode,
}: InstrumentQrLabelProps) {
  // Generated fresh, server-side, from our own instrument code — never
  // user-supplied SVG, and never persisted to storage.
  const qrSvg = await generateInstrumentQrSvg(instrumentCode);

  return (
    <div className="qr-label flex w-[70mm] flex-col items-center gap-1 border border-black bg-white px-4 py-5 text-center break-inside-avoid">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black">
        {clubName}
      </p>

      <div
        className="qr-label__code mt-1 h-[40mm] w-[40mm] shrink-0"
        // Trusted, app-generated markup from lib/qr.ts (the `qrcode`
        // package) — not user input.
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      <p className="mt-1 max-w-full truncate text-xs font-bold uppercase text-black">
        {instrumentName}
      </p>
      <p className="font-mono text-xs text-black">{instrumentCode}</p>
      <p className="mt-1 text-[9px] text-black">Scan to view instrument</p>
    </div>
  );
}
