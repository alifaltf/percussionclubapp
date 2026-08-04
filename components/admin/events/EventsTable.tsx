import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import EventBannerImage from "@/components/events/EventBannerImage";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import ArchiveStateBadge from "@/components/admin/instruments/ArchiveStateBadge";
import EventRowActions from "@/components/admin/events/EventRowActions";
import { formatEventDate, formatEventTimeRange } from "@/utils/format-event";
import type { Event } from "@/types/event";

interface EventsTableProps {
  events: Event[];
}

export default function EventsTable({ events }: EventsTableProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell className="w-16">Banner</TableHeadCell>
              <TableHeadCell>Event</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>Location</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Archive</TableHeadCell>
              <TableHeadCell className="text-right">Actions</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <EventBannerImage
                    src={event.banner_url}
                    alt={event.title}
                    sizes="48px"
                    className="h-12 w-12 rounded-sm"
                  />
                </TableCell>
                <TableCell>
                  <p className="flex items-center gap-1.5 font-medium text-[#111111]">
                    {event.title}
                    {event.is_featured && <Badge variant="gold">Featured</Badge>}
                  </p>
                  <p className="text-xs text-[#666666]">{event.slug}</p>
                </TableCell>
                <TableCell className="text-[#666666]">
                  <p>{formatEventDate(event.event_date, true)}</p>
                  <p className="text-xs">{formatEventTimeRange(event.start_time, event.end_time)}</p>
                </TableCell>
                <TableCell className="text-[#666666]">{event.location ?? "—"}</TableCell>
                <TableCell>
                  <EventStatusBadge status={event.status} />
                </TableCell>
                <TableCell>
                  <ArchiveStateBadge isArchived={Boolean(event.archived_at)} />
                </TableCell>
                <TableCell>
                  <EventRowActions event={event} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / narrow-screen card layout */}
      <div className="space-y-3 lg:hidden">
        {events.map((event) => (
          <div key={event.id} className="rounded-2xl border border-[#E8E8E8] bg-white p-4">
            <div className="flex gap-3">
              <EventBannerImage
                src={event.banner_url}
                alt={event.title}
                sizes="64px"
                className="h-16 w-16 shrink-0 rounded-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 truncate font-serif text-base font-semibold text-[#111111]">
                  {event.title}
                  {event.is_featured && <Badge variant="gold">Featured</Badge>}
                </p>
                <p className="text-xs text-[#666666]">
                  {formatEventDate(event.event_date, true)} ·{" "}
                  {formatEventTimeRange(event.start_time, event.end_time)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <EventStatusBadge status={event.status} />
                  <ArchiveStateBadge isArchived={Boolean(event.archived_at)} />
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-[#E8E8E8] pt-3">
              <EventRowActions event={event} className="items-start" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
