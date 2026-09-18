import Image from "next/image";
import { getInitials } from "@/utils/get-initials";

interface MemberAvatarProps {
  avatarUrl: string | null;
  name: string;
  /** Sizing/typography for the circle — pass both the box size and font size. */
  className?: string;
  /** next/image `sizes`, matched to the rendered box size in className. */
  sizes?: string;
}

/**
 * Small reusable avatar circle for admin member views (list + detail) —
 * shows the real avatar_url when set, falling back to initials otherwise.
 * Mirrors the Image/initials fallback AvatarUploader already uses for a
 * member's own profile page, so "what does this member look like" renders
 * consistently whether an admin or the member themselves is looking.
 */
export default function MemberAvatar({
  avatarUrl,
  name,
  className = "h-9 w-9 text-xs",
  sizes = "36px",
}: MemberAvatarProps) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E8E8] bg-[#F8F8F6] font-semibold text-[#111111] ${className}`}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} fill sizes={sizes} className="object-cover" />
      ) : (
        getInitials(name || "Member")
      )}
    </span>
  );
}
