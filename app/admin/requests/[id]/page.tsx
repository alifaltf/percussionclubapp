import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import BorrowStatusBadge from "@/components/borrowings/BorrowStatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import ApproveRejectControls from "@/components/admin/requests/ApproveRejectControls";
import CompleteReturnForm from "@/components/admin/requests/CompleteReturnForm";
import { AlertTriangleIcon } from "@/components/ui/icons";
import { getInitials } from "@/utils/get-initials";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAdminBorrowRequestById } from "@/lib/supabase/borrow-requests";
import { getSignedReturnPhotoUrl } from "@/lib/supabase/return-photos";
import { completeReturnAction } from "@/app/admin/requests/actions";

interface AdminRequestDetailPageProps {
  params: Promise<{ id: string }>;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const RETURN_STAGE_STATUSES = ["active", "return_submitted", "overdue"];

export default async function AdminRequestDetailPage({ params }: AdminRequestDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  let request;
  try {
    request = await getAdminBorrowRequestById(id);
  } catch {
    notFound();
  }

  if (!request) {
    notFound();
  }

  const returnPhotoUrl = request.return_photo_url
    ? await getSignedReturnPhotoUrl(request.return_photo_url)
    : null;

  const boundCompleteReturn = completeReturnAction.bind(null, request.id);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/admin/requests"
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
          Back to Requests
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <InstrumentImage
            src={request.instrument.image_url}
            alt={request.instrument.name}
            sizes="768px"
            className="aspect-[16/9] w-full"
          />

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
                {request.instrument.instrument_code}
              </span>
              <BorrowStatusBadge status={request.status} />
            </div>

            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111]">
              <Link
                href={`/admin/instruments/${request.instrument.id}/edit`}
                className="transition-colors duration-300 hover:text-[#C8A928]"
              >
                {request.instrument.name}
              </Link>
            </h1>

            <div className="mt-4 flex items-center gap-2.5 rounded-sm border border-[#E8E8E8] bg-[#F8F8F6] px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-xs font-semibold text-[#111111]">
                {getInitials(request.member.full_name ?? "Member")}
              </span>
              <div>
                <p className="text-sm font-medium text-[#111111]">
                  {request.member.full_name ?? "Unknown member"}
                </p>
                {request.member.phone && (
                  <p className="text-xs text-[#666666]">{request.member.phone}</p>
                )}
              </div>
            </div>

            {request.status === "overdue" && (
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                This borrowing is overdue.
              </div>
            )}

            <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[#E8E8E8] pt-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Purpose
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">{request.purpose}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Requested Borrow Date
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">
                  {DATE_FORMATTER.format(new Date(request.requested_borrow_date))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Requested Return Date
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">
                  {DATE_FORMATTER.format(new Date(request.requested_return_date))}
                </dd>
              </div>
              {request.actual_borrow_date && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Actual Borrow Date
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">
                    {DATE_FORMATTER.format(new Date(request.actual_borrow_date))}
                  </dd>
                </div>
              )}
              {request.actual_return_date && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Actual Return Date
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">
                    {DATE_FORMATTER.format(new Date(request.actual_return_date))}
                  </dd>
                </div>
              )}
              {request.condition_before && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Condition at Pickup
                  </dt>
                  <dd className="mt-1">
                    <ConditionBadge condition={request.condition_before} />
                  </dd>
                </div>
              )}
              {request.condition_after && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Condition at Return
                  </dt>
                  <dd className="mt-1">
                    <ConditionBadge condition={request.condition_after} />
                  </dd>
                </div>
              )}
              {request.admin_note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Admin Note
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">{request.admin_note}</dd>
                </div>
              )}
            </dl>

            {request.damage_reported && (
              <div className="mt-6 rounded-sm border border-amber-300 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                  <AlertTriangleIcon className="h-4 w-4" />
                  Damage Reported
                </p>
                {request.damage_notes && (
                  <p className="mt-1 text-sm text-[#666666]">{request.damage_notes}</p>
                )}
              </div>
            )}

            {returnPhotoUrl && (
              <div className="mt-6 border-t border-[#E8E8E8] pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Return Photo
                </p>
                <div className="relative mt-2 h-56 w-full max-w-sm overflow-hidden rounded-sm border border-[#E8E8E8]">
                  <Image
                    src={returnPhotoUrl}
                    alt="Submitted return photo"
                    fill
                    sizes="384px"
                    className="object-cover"
                  />
                </div>
                {request.return_notes && (
                  <p className="mt-2 text-sm text-[#666666]">{request.return_notes}</p>
                )}
              </div>
            )}

            {request.status === "pending" && (
              <div className="mt-8 border-t border-[#E8E8E8] pt-6">
                <h2 className="font-serif text-xl font-semibold text-[#111111]">
                  Review Request
                </h2>
                <div className="mt-4">
                  <ApproveRejectControls
                    requestId={request.id}
                    instrumentName={request.instrument.name}
                    memberName={request.member.full_name ?? "this member"}
                  />
                </div>
              </div>
            )}

            {RETURN_STAGE_STATUSES.includes(request.status) && (
              <div className="mt-8 border-t border-[#E8E8E8] pt-6">
                <h2 className="font-serif text-xl font-semibold text-[#111111]">
                  Verify Return
                </h2>
                <p className="mt-1 text-sm text-[#666666]">
                  {request.status === "return_submitted"
                    ? "The member has submitted their return. Confirm the instrument's condition."
                    : "The member hasn't submitted a return yet. You can still complete it manually if needed."}
                </p>
                <div className="mt-4">
                  <CompleteReturnForm
                    currentCondition={request.condition_before}
                    action={boundCompleteReturn}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
