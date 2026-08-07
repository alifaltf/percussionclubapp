import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import PriorityBadge from "@/components/announcements/PriorityBadge";
import AnnouncementStatusBadge from "@/components/admin/announcements/AnnouncementStatusBadge";
import ArchiveStateBadge from "@/components/admin/instruments/ArchiveStateBadge";
import AnnouncementRowActions from "@/components/admin/announcements/AnnouncementRowActions";
import { formatAnnouncementDate } from "@/utils/format-announcement";
import type { Announcement } from "@/types/announcement";

interface AnnouncementsTableProps {
  announcements: Announcement[];
}

export default function AnnouncementsTable({ announcements }: AnnouncementsTableProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Announcement</TableHeadCell>
              <TableHeadCell>Priority</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Published</TableHeadCell>
              <TableHeadCell>Archive</TableHeadCell>
              <TableHeadCell className="text-right">Actions</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((announcement) => (
              <TableRow key={announcement.id}>
                <TableCell>
                  <p className="flex items-center gap-1.5 font-medium text-[#111111]">
                    {announcement.title}
                    {announcement.is_pinned && <Badge variant="gold">Pinned</Badge>}
                  </p>
                  <p className="max-w-sm truncate text-xs text-[#666666]">{announcement.summary}</p>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={announcement.priority} />
                </TableCell>
                <TableCell>
                  <AnnouncementStatusBadge status={announcement.status} />
                </TableCell>
                <TableCell className="text-[#666666]">
                  {formatAnnouncementDate(announcement.published_at) ?? "—"}
                </TableCell>
                <TableCell>
                  <ArchiveStateBadge isArchived={Boolean(announcement.archived_at)} />
                </TableCell>
                <TableCell>
                  <AnnouncementRowActions announcement={announcement} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / narrow-screen card layout */}
      <div className="space-y-3 lg:hidden">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="rounded-2xl border border-[#E8E8E8] bg-white p-4">
            <p className="flex flex-wrap items-center gap-1.5 font-serif text-base font-semibold text-[#111111]">
              {announcement.title}
              {announcement.is_pinned && <Badge variant="gold">Pinned</Badge>}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-[#666666]">{announcement.summary}</p>
            <p className="mt-2 text-xs text-[#666666]">
              {formatAnnouncementDate(announcement.published_at) ?? "Unpublished"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={announcement.priority} />
              <AnnouncementStatusBadge status={announcement.status} />
              <ArchiveStateBadge isArchived={Boolean(announcement.archived_at)} />
            </div>
            <div className="mt-3 border-t border-[#E8E8E8] pt-3">
              <AnnouncementRowActions announcement={announcement} className="items-start" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
