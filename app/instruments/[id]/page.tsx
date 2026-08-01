import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import RequestToBorrowForm from "@/components/instruments/RequestToBorrowForm";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import StatusBadge from "@/components/instruments/StatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getInstrumentById } from "@/lib/supabase/instruments";
import { getMyOpenRequestForInstrument } from "@/lib/supabase/borrow-requests";
import { submitBorrowRequest } from "@/app/instruments/[id]/actions";
import { BORROW_REQUEST_STATUS_LABELS } from "@/types/borrow-request";
import { STATUS_UNAVAILABLE_REASONS } from "@/types/instrument";

interface InstrumentDetailPageProps {
  params: Promise<{ id: string }>;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function InstrumentDetailPage({
  params,
}: InstrumentDetailPageProps) {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  let instrument;
  try {
    instrument = await getInstrumentById(id);
  } catch {
    // A genuine load failure (not a missing/malformed id) — send members to
    // the not-found page rather than a raw error, since there's no
    // meaningful retry action to offer for a single-item lookup.
    notFound();
  }

  if (!instrument) {
    notFound();
  }

  const isAvailable = instrument.status === "available";
  const unavailableReason = STATUS_UNAVAILABLE_REASONS[instrument.status];
  const openRequest = await getMyOpenRequestForInstrument(instrument.id);
  const boundSubmit = submitBorrowRequest.bind(null, instrument.id);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/instruments"
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

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <InstrumentImage
            src={instrument.image_url}
            alt={instrument.name}
            sizes="(min-width: 1024px) 896px, 100vw"
            className="aspect-[16/9] w-full"
            priority
          />

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
                {instrument.instrument_code}
              </span>
              <StatusBadge status={instrument.status} />
              <ConditionBadge condition={instrument.condition} />
            </div>

            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              {instrument.name}
            </h1>
            <p className="mt-1 text-sm text-[#666666]">{instrument.category}</p>

            {instrument.description && (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#666666]">
                {instrument.description}
              </p>
            )}

            <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[#E8E8E8] pt-6 sm:grid-cols-2">
              {instrument.purchase_date && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Purchase Date
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">
                    {DATE_FORMATTER.format(new Date(instrument.purchase_date))}
                  </dd>
                </div>
              )}

              {instrument.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Notes
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[#111111]">
                    {instrument.notes}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-8 border-t border-[#E8E8E8] pt-6">
              {openRequest ? (
                <p className="text-sm text-[#666666]">
                  You already have a request for this instrument —{" "}
                  <span className="font-medium text-[#111111]">
                    {BORROW_REQUEST_STATUS_LABELS[openRequest.status]}
                  </span>
                  .{" "}
                  <Link
                    href="/my-requests"
                    className="font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
                  >
                    View My Requests →
                  </Link>
                </p>
              ) : isAvailable ? (
                <RequestToBorrowForm action={boundSubmit} />
              ) : (
                <p className="text-sm text-[#666666]">
                  {unavailableReason ??
                    "This instrument isn't available to borrow right now."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
