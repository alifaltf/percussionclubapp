import Link from "next/link";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import BorrowStatusBadge from "@/components/borrowings/BorrowStatusBadge";
import type { BorrowRequestAdminView } from "@/types/borrow-request";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(value: string | null): string {
  return value ? DATE_FORMATTER.format(new Date(value)) : "—";
}

interface MemberBorrowingHistoryProps {
  requests: BorrowRequestAdminView[];
}

/**
 * A member's full borrow-request history on the admin member detail page —
 * a summary list, not a second request-detail UI: every row links out to
 * the real /admin/requests/[id] page (same route RequestsTable already
 * links to) for review/approve/reject/complete-return actions. Reuses
 * BorrowStatusBadge and the effective-status values already computed by
 * getAdminBorrowRequestsForMember (withEffectiveStatuses), so "overdue"
 * here matches the Borrow Requests module exactly rather than re-deriving
 * it.
 */
export default function MemberBorrowingHistory({ requests }: MemberBorrowingHistoryProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Instrument</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Requested Borrow</TableHeadCell>
              <TableHeadCell>Requested Return</TableHeadCell>
              <TableHeadCell>Actual Return</TableHeadCell>
              <TableHeadCell className="text-right">Details</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <p className="font-medium text-[#111111]">{request.instrument.name}</p>
                  <p className="text-xs text-[#666666]">{request.instrument.instrument_code}</p>
                </TableCell>
                <TableCell>
                  <BorrowStatusBadge status={request.status} />
                </TableCell>
                <TableCell className="text-[#666666]">
                  {formatDate(request.requested_borrow_date)}
                </TableCell>
                <TableCell className="text-[#666666]">
                  {formatDate(request.requested_return_date)}
                </TableCell>
                <TableCell className="text-[#666666]">
                  {request.actual_return_date ? formatDate(request.actual_return_date) : "Not yet returned"}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/requests/${request.id}`}
                    className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
                  >
                    View →
                  </Link>
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
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-serif text-base font-semibold text-[#111111]">
                  {request.instrument.name}
                </p>
                <p className="text-xs text-[#666666]">{request.instrument.instrument_code}</p>
              </div>
              <BorrowStatusBadge status={request.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8E8E8] pt-3 text-xs">
              <div>
                <dt className="text-[#666666]">Requested Borrow</dt>
                <dd className="text-[#111111]">{formatDate(request.requested_borrow_date)}</dd>
              </div>
              <div>
                <dt className="text-[#666666]">Requested Return</dt>
                <dd className="text-[#111111]">{formatDate(request.requested_return_date)}</dd>
              </div>
              {request.actual_return_date && (
                <div className="col-span-2">
                  <dt className="text-[#666666]">Actual Return</dt>
                  <dd className="text-[#111111]">{formatDate(request.actual_return_date)}</dd>
                </div>
              )}
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
