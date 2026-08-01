import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import BorrowStatusBadge from "@/components/borrowings/BorrowStatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import ReturnForm from "@/components/borrowings/ReturnForm";
import ReportDamageButton from "@/components/borrowings/ReportDamageButton";
import { AlertTriangleIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getMyBorrowingById } from "@/lib/supabase/borrow-requests";
import { getSignedReturnPhotoUrl } from "@/lib/supabase/return-photos";
import { submitReturn, reportDamage } from "@/app/my-borrowings/[id]/actions";

interface MyBorrowingDetailPageProps {
  params: Promise<{ id: string }>;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function MyBorrowingDetailPage({ params }: MyBorrowingDetailPageProps) {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  let borrowing;
  try {
    borrowing = await getMyBorrowingById(id);
  } catch {
    notFound();
  }

  if (!borrowing) {
    notFound();
  }

  const canSubmitReturn = borrowing.status === "active" || borrowing.status === "overdue";
  const canReportDamage = canSubmitReturn;
  const returnPhotoUrl = borrowing.return_photo_url
    ? await getSignedReturnPhotoUrl(borrowing.return_photo_url)
    : null;

  const boundSubmitReturn = submitReturn.bind(null, borrowing.id);
  const boundReportDamage = reportDamage.bind(null, borrowing.id);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/my-borrowings"
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
          Back to My Borrowings
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <InstrumentImage
            src={borrowing.instrument.image_url}
            alt={borrowing.instrument.name}
            sizes="768px"
            className="aspect-[16/9] w-full"
          />

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
                {borrowing.instrument.instrument_code}
              </span>
              <BorrowStatusBadge status={borrowing.status} />
            </div>

            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111]">
              {borrowing.instrument.name}
            </h1>

            {borrowing.status === "overdue" && (
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                This borrowing is overdue — please submit your return as soon as possible.
              </div>
            )}

            <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[#E8E8E8] pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Purpose
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">{borrowing.purpose}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Condition at Pickup
                </dt>
                <dd className="mt-1">
                  {borrowing.condition_before ? (
                    <ConditionBadge condition={borrowing.condition_before} />
                  ) : (
                    <span className="text-sm text-[#666666]">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Borrowed On
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">
                  {borrowing.actual_borrow_date
                    ? DATE_FORMATTER.format(new Date(borrowing.actual_borrow_date))
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                  Due Back
                </dt>
                <dd className="mt-1 text-sm text-[#111111]">
                  {DATE_FORMATTER.format(new Date(borrowing.requested_return_date))}
                </dd>
              </div>

              {borrowing.actual_return_date && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Returned On
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">
                    {DATE_FORMATTER.format(new Date(borrowing.actual_return_date))}
                  </dd>
                </div>
              )}

              {borrowing.condition_after && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Condition at Return
                  </dt>
                  <dd className="mt-1">
                    <ConditionBadge condition={borrowing.condition_after} />
                  </dd>
                </div>
              )}
            </dl>

            {borrowing.damage_reported && (
              <div className="mt-6 rounded-sm border border-amber-300 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                  <AlertTriangleIcon className="h-4 w-4" />
                  Damage Reported
                </p>
                {borrowing.damage_notes && (
                  <p className="mt-1 text-sm text-[#666666]">{borrowing.damage_notes}</p>
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
                {borrowing.return_notes && (
                  <p className="mt-2 text-sm text-[#666666]">{borrowing.return_notes}</p>
                )}
              </div>
            )}

            {borrowing.status === "return_submitted" && (
              <p className="mt-6 border-t border-[#E8E8E8] pt-6 text-sm text-[#666666]">
                Your return has been submitted and is awaiting admin verification.
              </p>
            )}

            {borrowing.status === "completed" && borrowing.verified_at && (
              <p className="mt-6 border-t border-[#E8E8E8] pt-6 text-sm text-[#666666]">
                Verified by an admin on {DATE_FORMATTER.format(new Date(borrowing.verified_at))}.
              </p>
            )}

            {canSubmitReturn && (
              <div className="mt-8 border-t border-[#E8E8E8] pt-6">
                <h2 className="font-serif text-xl font-semibold text-[#111111]">
                  Submit Return
                </h2>
                <p className="mt-1 text-sm text-[#666666]">
                  Upload a photo of the instrument so an admin can verify its condition.
                </p>
                <div className="mt-4">
                  <ReturnForm requestId={borrowing.id} action={boundSubmitReturn} />
                </div>
              </div>
            )}

            {canReportDamage && !borrowing.damage_reported && (
              <div className="mt-6 border-t border-[#E8E8E8] pt-6">
                <ReportDamageButton action={boundReportDamage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
