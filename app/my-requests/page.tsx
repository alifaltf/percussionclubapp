import { redirect } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import BorrowStatusBadge from "@/components/borrowings/BorrowStatusBadge";
import CancelRequestButton from "@/components/borrowings/CancelRequestButton";
import { SwapIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getMyRequests } from "@/lib/supabase/borrow-requests";
import type { BorrowRequestWithInstrument } from "@/types/borrow-request";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function MyRequestsPage() {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let requests: BorrowRequestWithInstrument[] = [];
  let loadError = false;
  try {
    requests = await getMyRequests();
  } catch {
    loadError = true;
  }

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          Member Portal
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          My Requests
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          Every borrow request you&apos;ve submitted, including its current status.
        </p>

        <div className="mt-10">
          {loadError ? (
            <EmptyState
              icon={<SwapIcon className="h-5 w-5" />}
              title="Couldn't load your requests"
              description="Something went wrong. Please try again."
              action={
                <Button href="/my-requests" variant="outline">
                  Try Again
                </Button>
              }
            />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<SwapIcon className="h-5 w-5" />}
              title="No requests yet"
              description="Browse the instrument inventory to submit your first borrow request."
              action={
                <Button href="/instruments" variant="outline">
                  Browse Instruments
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeadCell className="w-16">Image</TableHeadCell>
                      <TableHeadCell>Instrument</TableHeadCell>
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
                          <Link
                            href={`/instruments/${request.instrument.id}`}
                            className="font-medium text-[#111111] transition-colors duration-300 hover:text-[#C8A928]"
                          >
                            {request.instrument.name}
                          </Link>
                          <p className="text-xs text-[#666666]">
                            {request.instrument.instrument_code}
                          </p>
                        </TableCell>
                        <TableCell className="text-[#666666]">
                          {DATE_FORMATTER.format(new Date(request.requested_borrow_date))}
                        </TableCell>
                        <TableCell className="text-[#666666]">
                          {DATE_FORMATTER.format(new Date(request.requested_return_date))}
                        </TableCell>
                        <TableCell>
                          <BorrowStatusBadge status={request.status} />
                          {request.status === "rejected" && request.admin_note && (
                            <p className="mt-1 max-w-xs text-xs text-[#666666]">
                              {request.admin_note}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-[#666666]">
                          {DATE_FORMATTER.format(new Date(request.created_at))}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {request.status === "pending" ? (
                              <CancelRequestButton
                                requestId={request.id}
                                instrumentName={request.instrument.name}
                              />
                            ) : (
                              <span className="text-xs text-[#666666]">—</span>
                            )}
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
                  <div
                    key={request.id}
                    className="rounded-2xl border border-[#E8E8E8] bg-white p-4"
                  >
                    <div className="flex gap-3">
                      <InstrumentImage
                        src={request.instrument.image_url}
                        alt={request.instrument.name}
                        sizes="56px"
                        className="h-14 w-14 shrink-0 rounded-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/instruments/${request.instrument.id}`}
                          className="truncate font-serif text-base font-semibold text-[#111111] transition-colors duration-300 hover:text-[#C8A928]"
                        >
                          {request.instrument.name}
                        </Link>
                        <p className="text-xs text-[#666666]">
                          {request.instrument.instrument_code}
                        </p>
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

                    {request.status === "rejected" && request.admin_note && (
                      <p className="mt-2 text-xs text-[#666666]">{request.admin_note}</p>
                    )}

                    {request.status === "pending" && (
                      <div className="mt-3 flex justify-end border-t border-[#E8E8E8] pt-3">
                        <CancelRequestButton
                          requestId={request.id}
                          instrumentName={request.instrument.name}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
