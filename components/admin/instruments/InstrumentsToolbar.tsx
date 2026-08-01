"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  CONDITION_LABELS,
  INSTRUMENT_CONDITIONS,
  INSTRUMENT_STATUSES,
  STATUS_LABELS,
} from "@/types/instrument";

const SELECT_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";
const SEARCH_DEBOUNCE_MS = 350;

interface InstrumentsToolbarProps {
  categories: string[];
}

export default function InstrumentsToolbar({ categories }: InstrumentsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const status = searchParams.get("status") ?? "all";
  const condition = searchParams.get("condition") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const archive = searchParams.get("archive") ?? "all";
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
    // Any search/filter/sort change invalidates the current page number.
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

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    condition !== "all" ||
    category !== "all" ||
    archive !== "all" ||
    sort !== "newest";

  function resetFilters() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch("");
    router.push(pathname);
  }

  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="sm:col-span-2 xl:col-span-1">
          <label htmlFor="admin-instrument-search" className={LABEL_CLASSES}>
            Search
          </label>
          <input
            id="admin-instrument-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by code, name or category"
            className={SELECT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="admin-instrument-status" className={LABEL_CLASSES}>
            Status
          </label>
          <select
            id="admin-instrument-status"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Statuses</option>
            {INSTRUMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-instrument-condition" className={LABEL_CLASSES}>
            Condition
          </label>
          <select
            id="admin-instrument-condition"
            value={condition}
            onChange={(event) => updateParams({ condition: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Conditions</option>
            {INSTRUMENT_CONDITIONS.map((value) => (
              <option key={value} value={value}>
                {CONDITION_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-instrument-category" className={LABEL_CLASSES}>
            Category
          </label>
          <select
            id="admin-instrument-category"
            value={category}
            onChange={(event) => updateParams({ category: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Categories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-instrument-archive" className={LABEL_CLASSES}>
            Archive
          </label>
          <select
            id="admin-instrument-archive"
            value={archive}
            onChange={(event) => updateParams({ archive: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label htmlFor="admin-instrument-sort" className={LABEL_CLASSES}>
            Sort
          </label>
          <select
            id="admin-instrument-sort"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
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
