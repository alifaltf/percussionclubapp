import EmptyState from "@/components/ui/EmptyState";
import MembersTable from "@/components/admin/members/MembersTable";
import { UsersIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAllMembers } from "@/lib/supabase/profiles";

export default async function AdminMembersPage() {
  const { user } = await requireAdmin();

  let members: Awaited<ReturnType<typeof getAllMembers>> = [];
  let loadError = false;

  try {
    members = await getAllMembers();
  } catch {
    loadError = true;
  }

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Admin
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            Members
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#666666]">
            View club members and manage who has admin access.
          </p>
        </div>

        <div className="mt-10">
          {loadError ? (
            <EmptyState
              icon={<UsersIcon className="h-5 w-5" />}
              title="Couldn't load members"
              description="Something went wrong while fetching the member list. Please try again."
            />
          ) : members.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-5 w-5" />}
              title="No members yet"
              description="Members will appear here once they sign in for the first time."
            />
          ) : (
            <MembersTable members={members} currentUserId={user.id} />
          )}
        </div>
      </div>
    </main>
  );
}
