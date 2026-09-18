import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import SummaryCard from "@/components/dashboard/SummaryCard";
import MemberAvatar from "@/components/admin/members/MemberAvatar";
import MemberRoleControl, { RoleBadge } from "@/components/admin/members/MemberRoleControl";
import MemberBorrowingHistory from "@/components/admin/members/MemberBorrowingHistory";
import { AlertTriangleIcon, ClockIcon, SwapIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getMemberById } from "@/lib/supabase/profiles";
import { getAdminBorrowRequestsForMember } from "@/lib/supabase/borrow-requests";
import type { BorrowRequestAdminView } from "@/types/borrow-request";

interface AdminMemberDetailPageProps {
  params: Promise<{ id: string }>;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function AdminMemberDetailPage({ params }: AdminMemberDetailPageProps) {
  const { user } = await requireAdmin();
  const { id } = await params;

  let member;
  try {
    member = await getMemberById(id);
  } catch {
    // A genuine load failure (not a missing/malformed id) — send admins to
    // the not-found page rather than a raw error, matching the instrument
    // and borrow-request detail pages' convention for a single-item lookup.
    notFound();
  }

  if (!member) {
    notFound();
  }

  let requests: BorrowRequestAdminView[] = [];
  let loadError = false;
  try {
    requests = await getAdminBorrowRequestsForMember(member.id);
  } catch {
    loadError = true;
  }

  // Effective-status counts derived from the same rows the history table
  // below renders — no separate aggregate query, no re-derivation of what
  // counts as "overdue" (that's already applied by
  // getAdminBorrowRequestsForMember via withEffectiveStatuses). "Current"
  // mirrors getMyBorrowStats's definition: active + return_submitted both
  // mean the member still physically has the instrument; overdue is kept
  // as its own bucket rather than folded into "current" so the two counts
  // don't overlap.
  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const currentCount = requests.filter(
    (request) => request.status === "active" || request.status === "return_submitted",
  ).length;
  const overdueCount = requests.filter((request) => request.status === "overdue").length;

  const isCurrentUser = member.id === user.id;

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/admin/members"
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
          Back to Members
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-4">
            <MemberAvatar
              avatarUrl={member.avatar_url}
              name={member.full_name || "Member"}
              className="h-16 w-16 text-lg"
              sizes="64px"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
                  {member.full_name || "Unnamed member"}
                </h1>
                {isCurrentUser && <Badge>You</Badge>}
              </div>
              <div className="mt-1.5">
                <RoleBadge role={member.role} />
              </div>
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[#E8E8E8] pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-[#111111]">{member.phone || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                Joined
              </dt>
              <dd className="mt-1 text-sm text-[#111111]">
                {DATE_FORMATTER.format(new Date(member.created_at))}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                Member ID
              </dt>
              <dd className="mt-1 font-mono text-xs text-[#666666]">{member.id}</dd>
            </div>
          </dl>

          <div className="mt-8 border-t border-[#E8E8E8] pt-6">
            <h2 className="font-serif text-lg font-semibold text-[#111111]">Role</h2>
            <p className="mt-1 text-sm text-[#666666]">
              Promote or demote this member&apos;s access to the admin portal.
            </p>
            <div className="mt-4">
              <MemberRoleControl
                memberId={member.id}
                memberName={member.full_name || "this member"}
                role={member.role}
                isCurrentUser={isCurrentUser}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-[#111111]">Borrowing Activity</h2>

          {loadError ? (
            <div className="mt-4">
              <EmptyState
                icon={<SwapIcon className="h-5 w-5" />}
                title="Couldn't load borrowing activity"
                description="Something went wrong while fetching this member's requests. Please try again."
              />
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                  icon={<ClockIcon className="h-5 w-5" />}
                  label="Pending Requests"
                  value={pendingCount}
                />
                <SummaryCard
                  icon={<SwapIcon className="h-5 w-5" />}
                  label="Current Borrowings"
                  value={currentCount}
                />
                <SummaryCard
                  icon={<AlertTriangleIcon className="h-5 w-5" />}
                  label="Overdue Borrowings"
                  value={overdueCount}
                />
              </div>

              <div className="mt-6">
                {requests.length === 0 ? (
                  <EmptyState
                    icon={<SwapIcon className="h-5 w-5" />}
                    title="No borrowing activity yet"
                    description="This member hasn't submitted any borrow requests."
                  />
                ) : (
                  <MemberBorrowingHistory requests={requests} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
