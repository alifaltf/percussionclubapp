import { Suspense } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { SwapIcon } from "@/components/ui/icons";
import RequestsToolbar from "@/components/admin/requests/RequestsToolbar";
import RequestsTable from "@/components/admin/requests/RequestsTable";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAdminBorrowRequests } from "@/lib/supabase/borrow-requests";
import type { AdminBorrowRequestsQuery } from "@/lib/supabase/borrow-requests";
import type { BorrowRequestAdminView, BorrowRequestStatus } from "@/types/borrow-request";

const PAGE_SIZE = 20;

interface AdminRequestsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const status = (firstValue(params.status) ?? "all") as BorrowRequestStatus | "all";
  const sort = (firstValue(params.sort) ?? "newest") as AdminBorrowRequestsQuery["sort"];
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const hasActiveFilters = search.trim() !== "" || status !== "all" || sort !== "newest";

  let requests: BorrowRequestAdminView[] = [];
  let totalCount = 0;
  let loadError = false;

  try {
    const result = await getAdminBorrowRequests({
      search,
      status,
      sort,
      page,
      pageSize: PAGE_SIZE,
    });
    requests = result.requests;
    totalCount = result.totalCount;
  } catch {
    loadError = true;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          Admin
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          Borrow Requests
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          Review, approve and verify member borrow requests.
        </p>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<SwapIcon className="h-5 w-5" />}
              title="Couldn't load requests"
              description="Something went wrong while fetching requests. Please try again."
              action={
                <Button href="/admin/requests" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-10">
              <Suspense fallback={null}>
                <RequestsToolbar />
              </Suspense>
            </div>

            <div className="mt-6">
              {requests.length === 0 ? (
                <EmptyState
                  icon={<SwapIcon className="h-5 w-5" />}
                  title={hasActiveFilters ? "No requests found" : "No requests yet"}
                  description={
                    hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Member borrow requests will appear here once submitted."
                  }
                />
              ) : (
                <>
                  <RequestsTable requests={requests} />
                  <div className="mt-6">
                    <Suspense fallback={null}>
                      <Pagination page={page} totalPages={totalPages} />
                    </Suspense>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
