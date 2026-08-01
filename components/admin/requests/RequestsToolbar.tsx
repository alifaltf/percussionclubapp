"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { BORROW_REQUEST_STATUSES, BORROW_REQUEST_STATUS_LABELS } from "@/types/borrow-request";

const SELECT_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";
const SEARCH_DEBOUNCE_MS = 350;

export default function RequestsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const status = searchParams.get("status") ?? "all";
  const sort = searchParams.get("sort") ?? "newest";

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ q: value }), SEARCH_DEBOUNCE_MS);
  }

  const hasActiveFilters = search.trim() !== "" || status !== "all" || sort !== "newest";

  function resetFilters() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch("");
    router.push(pathname);
  }

  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="admin-request-search" className={LABEL_CLASSES}>
            Search
          </label>
          <input
            id="admin-request-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by instrument code or name"
            className={SELECT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="admin-request-status" className={LABEL_CLASSES}>
            Status
          </label>
          <select
            id="admin-request-status"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Statuses</option>
            {BORROW_REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {BORROW_REQUEST_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-request-sort" className={LABEL_CLASSES}>
            Sort
          </label>
          <select
            id="admin-request-sort"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="newest">Newest Submitted</option>
            <option value="oldest">Oldest Submitted</option>
            <option value="return-date-asc">Return Date (Soonest)</option>
            <option value="return-date-desc">Return Date (Latest)</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
