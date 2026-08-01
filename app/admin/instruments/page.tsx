import { Suspense } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { InstrumentIcon, PlusIcon } from "@/components/ui/icons";
import InstrumentStatsRow from "@/components/admin/instruments/InstrumentStatsRow";
import InstrumentsToolbar from "@/components/admin/instruments/InstrumentsToolbar";
import InstrumentsTable from "@/components/admin/instruments/InstrumentsTable";
import { requireAdmin } from "@/lib/supabase/require-admin";
import {
  getAdminInstruments,
  getInstrumentCategories,
  getInstrumentStats,
} from "@/lib/supabase/instruments";
import type {
  Instrument,
  InstrumentArchiveState,
  InstrumentCondition,
  InstrumentSort,
  InstrumentStats,
  InstrumentStatus,
} from "@/types/instrument";

const PAGE_SIZE = 20;

interface AdminInstrumentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminInstrumentsPage({
  searchParams,
}: AdminInstrumentsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const status = (firstValue(params.status) ?? "all") as InstrumentStatus | "all";
  const category = firstValue(params.category) ?? "all";
  const condition = (firstValue(params.condition) ?? "all") as InstrumentCondition | "all";
  const archiveState = (firstValue(params.archive) ?? "all") as InstrumentArchiveState;
  const sort = (firstValue(params.sort) ?? "newest") as InstrumentSort;
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    condition !== "all" ||
    category !== "all" ||
    archiveState !== "all";

  let stats: InstrumentStats | null = null;
  let categories: string[] = [];
  let instruments: Instrument[] = [];
  let totalCount = 0;
  let loadError = false;

  try {
    const [statsResult, categoriesResult, listResult] = await Promise.all([
      getInstrumentStats(),
      getInstrumentCategories(),
      getAdminInstruments({
        search,
        status,
        category,
        condition,
        archiveState,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    ]);
    stats = statsResult;
    categories = categoriesResult;
    instruments = listResult.instruments;
    totalCount = listResult.totalCount;
  } catch {
    loadError = true;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
              Admin
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              Instrument Management
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#666666]">
              Add, edit and archive the club&apos;s instrument inventory.
            </p>
          </div>
          <Button href="/admin/instruments/new">
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Add Instrument
          </Button>
        </div>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<InstrumentIcon className="h-5 w-5" />}
              title="Couldn't load instruments"
              description="Something went wrong while fetching the inventory. Please try again."
              action={
                <Button href="/admin/instruments" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {stats && (
              <div className="mt-10">
                <InstrumentStatsRow stats={stats} />
              </div>
            )}

            <div className="mt-8">
              <Suspense fallback={null}>
                <InstrumentsToolbar categories={categories} />
              </Suspense>
            </div>

            <div className="mt-6">
              {instruments.length === 0 ? (
                <EmptyState
                  icon={<InstrumentIcon className="h-5 w-5" />}
                  title={hasActiveFilters ? "No instruments found" : "No instruments yet"}
                  description={
                    hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Add your first instrument to get started."
                  }
                  action={
                    !hasActiveFilters ? (
                      <Button href="/admin/instruments/new" variant="outline">
                        Add Instrument
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <InstrumentsTable instruments={instruments} />
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
