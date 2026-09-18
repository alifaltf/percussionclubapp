import Link from "next/link";
import { notFound } from "next/navigation";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import StatusBadge from "@/components/instruments/StatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import ArchiveStateBadge from "@/components/admin/instruments/ArchiveStateBadge";
import ArchiveInstrumentButton from "@/components/admin/instruments/ArchiveInstrumentButton";
import BorrowStatusBadge from "@/components/borrowings/BorrowStatusBadge";
import RepairBorrowedStatusButton from "@/components/admin/instruments/RepairBorrowedStatusButton";
import EmptyState from "@/components/ui/EmptyState";
import { AlertTriangleIcon, SwapIcon } from "@/components/ui/icons";
import { getInitials } from "@/utils/get-initials";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getInstrumentByIdForAdmin } from "@/lib/supabase/instruments";
import {
  getOpenBorrowRequestForInstrument,
  type InstrumentBorrowingSummary,
} from "@/lib/supabase/borrow-requests";
import type { Instrument } from "@/types/instrument";

interface InstrumentDetailPageProps {
  params: Promise<{ id: string }>;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/**
 * Admin read-only instrument detail page — the "View" destination reached
 * from the instrument list/table/card. Complements (doesn't replace) the
 * Edit form: this is where an admin sees the instrument's current state at
 * a glance, including whether it's actively borrowed, without switching to
 * the Borrow Requests module. Current borrowing is summarized only —
 * anything beyond this (purpose, return photo, damage notes, etc.) is a
 * click away at /admin/requests/[id], so this page never duplicates that
 * module's own detail view.
 */
export default async function AdminInstrumentDetailPage({
  params,
}: InstrumentDetailPageProps) {
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

  let summary: InstrumentBorrowingSummary | null = null;
  let borrowingLoadError = false;
  try {
    summary = await getOpenBorrowRequestForInstrument(instrument.id);
  } catch {
    borrowingLoadError = true;
  }

  const isArchived = Boolean(instrument.archived_at);

  // Case D: raw status is "borrowed" but there's no pending or open
  // borrowing record behind it at all — a data inconsistency, not a real
  // borrowing. Only this case exposes the repair action; a merely-pending
  // request (case B) or a legitimate current borrowing (case C) never do,
  // and neither does a load error, since we can't confirm the inconsistency
  // is real without having successfully checked for a borrowing record.
  const isInconsistentBorrowed =
    instrument.status === "borrowed" && !borrowingLoadError && summary === null;

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
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

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <InstrumentImage
            src={instrument.image_url}
            alt={instrument.name}
            sizes="768px"
            className="aspect-[16/9] w-full"
          />

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
                {instrument.instrument_code}
              </span>
              <StatusBadge status={instrument.status} />
              <ConditionBadge condition={instrument.condition} />
              <ArchiveStateBadge isArchived={isArchived} />
            </div>

            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111]">
              {instrument.name}
            </h1>
            <p className="mt-1 text-sm text-[#666666]">{instrument.category}</p>

            {isArchived && (
              <div className="mt-4 rounded-sm border border-[#E8E8E8] bg-[#F8F8F6] px-3 py-2 text-sm text-[#666666]">
                This instrument is archived — it&apos;s hidden from members and
                can&apos;t be borrowed until it&apos;s unarchived.
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href={`/admin/instruments/${instrument.id}/edit`}
                className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
              >
                Edit Instrument
              </Link>
              <Link
                href={`/admin/instruments/${instrument.id}/qr`}
                className="text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
              >
                QR Label
              </Link>
              <ArchiveInstrumentButton
                instrumentId={instrument.id}
                instrumentName={instrument.name}
                isArchived={isArchived}
              />
            </div>

            <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[#E8E8E8] pt-6 sm:grid-cols-2">
              {instrument.description && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Description
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-[#111111]">
                    {instrument.description}
                  </dd>
                </div>
              )}
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
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-[#111111]">
                    {instrument.notes}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Added
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">
                  {DATE_FORMATTER.format(new Date(instrument.created_at))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">
                  {DATE_FORMATTER.format(new Date(instrument.updated_at))}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-[#111111]">
            {isInconsistentBorrowed
              ? "Borrowing Status Issue"
              : summary?.kind === "pending"
                ? "Pending Request"
                : "Current Borrowing"}
          </h2>

          <div className="mt-4">
            {borrowingLoadError ? (
              <EmptyState
                icon={<SwapIcon className="h-5 w-5" />}
                title="Couldn't load borrowing status"
                description="Something went wrong while checking this instrument's borrowing state. Please try again."
              />
            ) : isInconsistentBorrowed ? (
              <div className="rounded-sm border border-amber-300 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                  <AlertTriangleIcon className="h-4 w-4" />
                  Inconsistent Borrowing State
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Instrument is marked as borrowed, but no active borrowing record exists.
                </p>
                <p className="mt-1 text-sm text-[#666666]">
                  This can happen if the underlying data was changed outside the normal
                  borrowing workflow. Editing this instrument won&apos;t fix its status — use
                  the action below only once you&apos;ve confirmed it isn&apos;t actually out on
                  loan.
                </p>
                <RepairBorrowedStatusButton
                  instrumentId={instrument.id}
                  instrumentName={instrument.name}
                  className="mt-4"
                />
              </div>
            ) : summary ? (
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
                {summary.kind === "pending" && (
                  <p className="mb-5 rounded-sm border border-[#E8E8E8] bg-[#F8F8F6] px-3 py-2 text-sm text-[#666666]">
                    This is a pending request awaiting review — the instrument hasn&apos;t
                    actually been borrowed yet.
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] bg-[#F8F8F6] text-xs font-semibold text-[#111111]">
                      {getInitials(summary.request.member.full_name ?? "Member")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">
                        {summary.request.member.full_name ?? "Unknown member"}
                      </p>
                      {summary.request.member.phone && (
                        <p className="text-xs text-[#666666]">{summary.request.member.phone}</p>
                      )}
                    </div>
                  </div>
                  <BorrowStatusBadge status={summary.request.status} />
                </div>

                <dl className="mt-5 grid grid-cols-1 gap-5 border-t border-[#E8E8E8] pt-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                      Requested Borrow Date
                    </dt>
                    <dd className="mt-1 text-sm text-[#111111]">
                      {DATE_FORMATTER.format(new Date(summary.request.requested_borrow_date))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                      Expected Return Date
                    </dt>
                    <dd className="mt-1 text-sm text-[#111111]">
                      {DATE_FORMATTER.format(new Date(summary.request.requested_return_date))}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 border-t border-[#E8E8E8] pt-5">
                  <Link
                    href={`/admin/requests/${summary.request.id}`}
                    className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
                  >
                    View Full Request →
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<SwapIcon className="h-5 w-5" />}
                title="No active borrowing"
                description="This instrument isn't currently borrowed and has no pending request."
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
