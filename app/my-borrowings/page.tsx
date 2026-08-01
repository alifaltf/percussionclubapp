import { redirect } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import BorrowStatusBadge from "@/components/borrowings/BorrowStatusBadge";
import { InstrumentIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getMyBorrowings } from "@/lib/supabase/borrow-requests";
import type { BorrowRequestWithInstrument } from "@/types/borrow-request";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function MyBorrowingsPage() {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let borrowings: BorrowRequestWithInstrument[] = [];
  let loadError = false;
  try {
    borrowings = await getMyBorrowings();
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
          My Borrowings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          Instruments you&apos;re currently borrowing, plus your return history.
        </p>

        <div className="mt-10">
          {loadError ? (
            <EmptyState
              icon={<InstrumentIcon className="h-5 w-5" />}
              title="Couldn't load your borrowings"
              description="Something went wrong. Please try again."
              action={
                <Button href="/my-borrowings" variant="outline">
                  Try Again
                </Button>
              }
            />
          ) : borrowings.length === 0 ? (
            <EmptyState
              icon={<InstrumentIcon className="h-5 w-5" />}
              title="No borrowings yet"
              description="Once an admin approves a request, it will show up here."
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
                      <TableHeadCell>Borrowed</TableHeadCell>
                      <TableHeadCell>Due Back</TableHeadCell>
                      <TableHeadCell>Status</TableHeadCell>
                      <TableHeadCell className="text-right">Details</TableHeadCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrowings.map((borrowing) => (
                      <TableRow key={borrowing.id}>
                        <TableCell>
                          <InstrumentImage
                            src={borrowing.instrument.image_url}
                            alt={borrowing.instrument.name}
                            sizes="48px"
                            className="h-12 w-12 rounded-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-[#111111]">{borrowing.instrument.name}</p>
                          <p className="text-xs text-[#666666]">
                            {borrowing.instrument.instrument_code}
                          </p>
                        </TableCell>
                        <TableCell className="text-[#666666]">
                          {borrowing.actual_borrow_date
                            ? DATE_FORMATTER.format(new Date(borrowing.actual_borrow_date))
                            : "—"}
                        </TableCell>
                        <TableCell className="text-[#666666]">
                          {DATE_FORMATTER.format(new Date(borrowing.requested_return_date))}
                        </TableCell>
                        <TableCell>
                          <BorrowStatusBadge status={borrowing.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Link
                              href={`/my-borrowings/${borrowing.id}`}
                              className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
                            >
                              View →
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
                {borrowings.map((borrowing) => (
                  <Link
                    key={borrowing.id}
                    href={`/my-borrowings/${borrowing.id}`}
                    className="block rounded-2xl border border-[#E8E8E8] bg-white p-4 transition-colors duration-300 hover:border-[#C8A928]"
                  >
                    <div className="flex gap-3">
                      <InstrumentImage
                        src={borrowing.instrument.image_url}
                        alt={borrowing.instrument.name}
                        sizes="56px"
                        className="h-14 w-14 shrink-0 rounded-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-base font-semibold text-[#111111]">
                          {borrowing.instrument.name}
                        </p>
                        <p className="text-xs text-[#666666]">
                          {borrowing.instrument.instrument_code}
                        </p>
                        <div className="mt-2">
                          <BorrowStatusBadge status={borrowing.status} />
                        </div>
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8E8E8] pt-3 text-xs">
                      <div>
                        <dt className="text-[#666666]">Borrowed</dt>
                        <dd className="text-[#111111]">
                          {borrowing.actual_borrow_date
                            ? DATE_FORMATTER.format(new Date(borrowing.actual_borrow_date))
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#666666]">Due Back</dt>
                        <dd className="text-[#111111]">
                          {DATE_FORMATTER.format(new Date(borrowing.requested_return_date))}
                        </dd>
                      </div>
                    </dl>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
