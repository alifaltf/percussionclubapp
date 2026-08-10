"use client";

import Button from "@/components/ui/Button";

interface QrLabelPrintControlsProps {
  /** /api/instruments/qr/[code] — omitted on the bulk page, where there's no single file to download. */
  downloadHref?: string;
}

export default function QrLabelPrintControls({ downloadHref }: QrLabelPrintControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
      <Button type="button" onClick={() => window.print()}>
        Print
      </Button>
      {downloadHref && (
        <Button href={downloadHref} variant="outline">
          Download QR (PNG)
        </Button>
      )}
    </div>
  );
}
