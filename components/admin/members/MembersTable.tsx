import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import MemberRoleControl, { RoleBadge } from "@/components/admin/members/MemberRoleControl";
import type { Member } from "@/lib/supabase/profiles";

interface MembersTableProps {
  members: Member[];
  currentUserId: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatJoinedDate(value: string): string {
  return DATE_FORMATTER.format(new Date(value));
}

export default function MembersTable({ members, currentUserId }: MembersTableProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Full Name</TableHeadCell>
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Joined</TableHeadCell>
              <TableHeadCell className="text-right">Actions</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium text-[#111111]">
                      {member.full_name || "Unnamed member"}
                      {isCurrentUser && <Badge>You</Badge>}
                    </p>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="text-[#666666]">
                    {formatJoinedDate(member.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <MemberRoleControl
                      memberId={member.id}
                      memberName={member.full_name || "this member"}
                      role={member.role}
                      isCurrentUser={isCurrentUser}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / narrow-screen card layout */}
      <div className="space-y-3 lg:hidden">
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId;
          return (
            <div key={member.id} className="rounded-2xl border border-[#E8E8E8] bg-white p-4">
              <p className="flex flex-wrap items-center gap-1.5 font-serif text-base font-semibold text-[#111111]">
                {member.full_name || "Unnamed member"}
                {isCurrentUser && <Badge>You</Badge>}
              </p>
              <p className="mt-2 text-xs text-[#666666]">
                Joined {formatJoinedDate(member.created_at)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={member.role} />
              </div>
              <div className="mt-3 border-t border-[#E8E8E8] pt-3">
                <MemberRoleControl
                  memberId={member.id}
                  memberName={member.full_name || "this member"}
                  role={member.role}
                  isCurrentUser={isCurrentUser}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
