import Link from "next/link";
import { notFound } from "next/navigation";
import InstrumentQrLabel from "@/components/admin/instruments/InstrumentQrLabel";
import QrLabelPrintControls from "@/components/admin/instruments/QrLabelPrintControls";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getInstrumentByIdForAdmin } from "@/lib/supabase/instruments";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

interface InstrumentQrPageProps {
  params: Promise<{ id: string }>;
}

export default async function InstrumentQrPage({ params }: InstrumentQrPageProps) {
  await requireAdmin();
  const { id } = await params;

  let instrument;
  try {
    instrument = await getInstrumentByIdForAdmin(id);
  } catch {
    notFound();
  }
  if (!instrument) {
    notFound();
  }

  const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20 print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-2xl">
        <div className="print:hidden">
          <Link
            href={`/admin/instruments/${instrument.id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Instrument
          </Link>

          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            QR Label
          </h1>
          <p className="mt-2 text-sm text-[#666666]">
            {instrument.name} — {instrument.instrument_code}
          </p>
          {instrument.archived_at && (
            <p className="mt-2 text-sm text-[#666666]">
              This instrument is archived — its public page will show
              &quot;Instrument Not Found&quot; until it&apos;s unarchived.
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 print:mt-0">
          <InstrumentQrLabel
            clubName={settings.club_name}
            instrumentName={instrument.name}
            instrumentCode={instrument.instrument_code}
          />
          <QrLabelPrintControls
            downloadHref={`/api/instruments/qr/${encodeURIComponent(instrument.instrument_code)}`}
          />
        </div>
      </div>
    </main>
  );
}
