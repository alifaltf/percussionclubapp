import Link from "next/link";
import Badge from "@/components/ui/Badge";
import PriorityBadge from "@/components/announcements/PriorityBadge";
import { formatAnnouncementDate } from "@/utils/format-announcement";
import type { Announcement } from "@/types/announcement";

interface AnnouncementCardProps {
  announcement: Announcement;
}

// Urgent announcements get a stronger left accent so they stand out in a
// list without breaking the site's otherwise minimal, thin-border style.
const ACCENT_CLASSES: Record<Announcement["priority"], string> = {
  normal: "border-l-[#E8E8E8]",
  important: "border-l-amber-400",
  urgent: "border-l-red-500",
};

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const publishedLabel = formatAnnouncementDate(announcement.published_at);
  const expiresLabel = formatAnnouncementDate(announcement.expires_at);

  return (
    <Link
      href={`/announcements/${announcement.id}`}
      className={`block border border-[#E8E8E8] border-l-4 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${ACCENT_CLASSES[announcement.priority]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {announcement.is_pinned && <Badge variant="gold">Pinned</Badge>}
        <PriorityBadge priority={announcement.priority} />
        {publishedLabel && <span className="text-xs text-[#666666]">{publishedLabel}</span>}
      </div>

      <h3 className="mt-3 font-serif text-xl font-semibold text-[#111111]">
        {announcement.title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[#666666]">{announcement.summary}</p>

      {expiresLabel && (
        <p className="mt-3 text-xs text-[#666666]">Expires {expiresLabel}</p>
      )}
    </Link>
  );
}
