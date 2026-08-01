import Link from "next/link";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import BorrowStatusBadge from "@/components/borrowings/BorrowStatusBadge";
import { getInitials } from "@/utils/get-initials";
import type { BorrowRequestAdminView } from "@/types/borrow-request";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

interface RequestsTableProps {
  requests: BorrowRequestAdminView[];
}

export default function RequestsTable({ requests }: RequestsTableProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell className="w-16">Image</TableHeadCell>
              <TableHeadCell>Instrument</TableHeadCell>
              <TableHeadCell>Member</TableHeadCell>
              <TableHeadCell>Borrow Date</TableHeadCell>
              <TableHeadCell>Return Date</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Submitted</TableHeadCell>
              <TableHeadCell className="text-right">Actions</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <InstrumentImage
                    src={request.instrument.image_url}
                    alt={request.instrument.name}
                    sizes="48px"
                    className="h-12 w-12 rounded-sm"
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-[#111111]">{request.instrument.name}</p>
                  <p className="text-xs text-[#666666]">{request.instrument.instrument_code}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] bg-[#F8F8F6] text-[11px] font-semibold text-[#111111]">
                      {getInitials(request.member.full_name ?? "Member")}
                    </span>
                    <span className="text-[#111111]">{request.member.full_name ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[#666666]">
                  {DATE_FORMATTER.format(new Date(request.requested_borrow_date))}
                </TableCell>
                <TableCell className="text-[#666666]">
                  {DATE_FORMATTER.format(new Date(request.requested_return_date))}
                </TableCell>
                <TableCell>
                  <BorrowStatusBadge status={request.status} />
                </TableCell>
                <TableCell className="text-[#666666]">
                  {DATE_FORMATTER.format(new Date(request.created_at))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Link
                      href={`/admin/requests/${request.id}`}
                      className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
                    >
                      Review →
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card layout */}
      <div className="space-y-3 lg:hidden">
        {requests.map((request) => (
          <Link
            key={request.id}
            href={`/admin/requests/${request.id}`}
            className="block rounded-2xl border border-[#E8E8E8] bg-white p-4 transition-colors duration-300 hover:border-[#C8A928]"
          >
            <div className="flex gap-3">
              <InstrumentImage
                src={request.instrument.image_url}
                alt={request.instrument.name}
                sizes="56px"
                className="h-14 w-14 shrink-0 rounded-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base font-semibold text-[#111111]">
                  {request.instrument.name}
                </p>
                <p className="text-xs text-[#666666]">{request.member.full_name ?? "—"}</p>
                <div className="mt-2">
                  <BorrowStatusBadge status={request.status} />
                </div>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8E8E8] pt-3 text-xs">
              <div>
                <dt className="text-[#666666]">Borrow Date</dt>
                <dd className="text-[#111111]">
                  {DATE_FORMATTER.format(new Date(request.requested_borrow_date))}
                </dd>
              </div>
              <div>
                <dt className="text-[#666666]">Return Date</dt>
                <dd className="text-[#111111]">
                  {DATE_FORMATTER.format(new Date(request.requested_return_date))}
                </dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
