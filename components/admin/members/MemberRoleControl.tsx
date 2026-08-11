"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { updateMemberRole } from "@/app/admin/members/actions";
import type { UserRole } from "@/types/profile";

interface MemberRoleControlProps {
  memberId: string;
  memberName: string;
  role: UserRole;
  isCurrentUser: boolean;
}

export default function MemberRoleControl({
  memberId,
  memberName,
  role,
  isCurrentUser,
}: MemberRoleControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // The acting admin's own row: never offer a control that could demote
  // them — the RPC would reject it anyway, but the UI shouldn't even
  // suggest it's possible.
  if (isCurrentUser) {
    return (
      <span className="text-xs font-medium uppercase tracking-wide text-[#666666]">
        This is you
      </span>
    );
  }

  const targetRole: UserRole = role === "admin" ? "member" : "admin";
  const isPromoting = targetRole === "admin";

  function handleClick() {
    const confirmMessage = isPromoting
      ? `Promote "${memberName}" to admin? They will gain full admin access.`
      : `Demote "${memberName}" to member? They will lose admin access.`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole(memberId, targetRole);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`text-sm font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
          isPromoting
            ? "text-[#666666] hover:text-[#C8A928]"
            : "text-[#666666] hover:text-red-600"
        }`}
      >
        {isPending
          ? isPromoting
            ? "Promoting..."
            : "Demoting..."
          : isPromoting
            ? "Promote to Admin"
            : "Demote to Member"}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={role === "admin" ? "gold" : "default"}>
      {role === "admin" ? "Admin" : "Member"}
    </Badge>
  );
}
