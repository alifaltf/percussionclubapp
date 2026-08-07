import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PriorityBadge from "@/components/announcements/PriorityBadge";
import { MegaphoneIcon } from "@/components/ui/icons";
import type { Announcement } from "@/types/announcement";

interface AnnouncementsListCardProps {
  announcements: Announcement[];
}

export default function AnnouncementsListCard({ announcements }: AnnouncementsListCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] text-[#C8A928]">
          <MegaphoneIcon className="h-4 w-4" />
        </span>
        <h2 className="font-serif text-lg font-semibold text-[#111111]">
          Recent Announcements
        </h2>
      </div>

      {announcements.length === 0 ? (
        <p className="mt-5 text-sm text-[#666666]">No announcements yet.</p>
      ) : (
        <ul className="mt-5">
          {announcements.map((announcement) => (
            <li key={announcement.id}>
              <Link
                href={`/announcements/${announcement.id}`}
                className="block border-t border-[#E8E8E8] py-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {announcement.is_pinned && <Badge variant="gold">Pinned</Badge>}
                  {announcement.priority !== "normal" && (
                    <PriorityBadge priority={announcement.priority} />
                  )}
                </div>
                <p className="mt-1 text-sm text-[#111111]">{announcement.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/announcements"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
      >
        View All Announcements
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </Card>
  );
}
