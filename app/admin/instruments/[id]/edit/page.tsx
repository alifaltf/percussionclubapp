import Link from "next/link";
import { notFound } from "next/navigation";
import InstrumentForm from "@/components/admin/instruments/InstrumentForm";
import ArchiveInstrumentButton from "@/components/admin/instruments/ArchiveInstrumentButton";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getInstrumentByIdForAdmin } from "@/lib/supabase/instruments";
import { updateInstrument } from "@/app/admin/instruments/actions";
import type { Instrument } from "@/types/instrument";

interface EditInstrumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInstrumentPage({ params }: EditInstrumentPageProps) {
  await requireAdmin();
  const { id } = await params;

  let instrument: Instrument | null;
  try {
    instrument = await getInstrumentByIdForAdmin(id);
  } catch {
    notFound();
  }

  if (!instrument) {
    notFound();
  }

  const boundUpdate = updateInstrument.bind(null, id);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
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

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              Edit Instrument
            </h1>
            <p className="mt-2 text-sm text-[#666666]">{instrument.instrument_code}</p>
          </div>
          <ArchiveInstrumentButton
            instrumentId={instrument.id}
            instrumentName={instrument.name}
            isArchived={Boolean(instrument.archived_at)}
            redirectTo="/admin/instruments"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-sm sm:p-10">
          <InstrumentForm mode="edit" instrument={instrument} action={boundUpdate} />
        </div>
      </div>
    </main>
  );
}
