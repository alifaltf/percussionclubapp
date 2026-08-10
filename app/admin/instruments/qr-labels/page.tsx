import Link from "next/link";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { InstrumentIcon } from "@/components/ui/icons";
import InstrumentQrLabel from "@/components/admin/instruments/InstrumentQrLabel";
import QrLabelPrintControls from "@/components/admin/instruments/QrLabelPrintControls";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getInstrumentsByIds } from "@/lib/supabase/instruments";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

interface QrLabelsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Bulk QR label print sheet. The `ids` query string is treated as
 * completely untrusted — even though it's normally produced by the admin
 * table's own selection, nothing stops it being hand-edited. Every id is
 * re-verified server-side by requireAdmin() (auth) and
 * getInstrumentsByIds() (existence — ids that don't correspond to a real
 * row are silently dropped, never trusted at face value), and the
 * function itself caps the batch at 20 to match the admin list's page
 * size, so this never generates QR codes for an unbounded id list.
 */
export default async function QrLabelsPage({ searchParams }: QrLabelsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const idsParam = firstValue(params.ids) ?? "";
  const requestedIds = idsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const instruments = requestedIds.length > 0 ? await getInstrumentsByIds(requestedIds) : [];
  const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20 print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-5xl">
        <div className="print:hidden">
          <Link
            href="/admin/instruments"
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
            Back to Instruments
          </Link>

          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            QR Labels
          </h1>
          <p className="mt-2 text-sm text-[#666666]">
            {instruments.length} label{instruments.length === 1 ? "" : "s"} ready to print.
          </p>
        </div>

        {instruments.length === 0 ? (
          <div className="mt-10 print:hidden">
            <EmptyState
              icon={<InstrumentIcon className="h-5 w-5" />}
              title="No instruments selected"
              description="Select instruments from the inventory table and choose “Generate QR Labels”."
              action={
                <Button href="/admin/instruments" variant="outline">
                  Back to Instruments
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 print:hidden">
              <QrLabelPrintControls />
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 print:mt-0 print:justify-start print:gap-4">
              {instruments.map((instrument) => (
                <InstrumentQrLabel
                  key={instrument.id}
                  clubName={settings.club_name}
                  instrumentName={instrument.name}
                  instrumentCode={instrument.instrument_code}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
