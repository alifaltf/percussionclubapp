"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { GALLERY_ALBUM_STATUSES, GALLERY_ALBUM_STATUS_LABELS } from "@/types/gallery";

const SELECT_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";
const SEARCH_DEBOUNCE_MS = 350;

export default function AlbumsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const status = searchParams.get("status") ?? "all";
  const archive = searchParams.get("archive") ?? "all";
  const featured = searchParams.get("featured") ?? "all";
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

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    archive !== "all" ||
    featured !== "all" ||
    sort !== "newest";

  function resetFilters() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch("");
    router.push(pathname);
  }

  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="sm:col-span-2 xl:col-span-1">
          <label htmlFor="admin-gallery-search" className={LABEL_CLASSES}>
            Search
          </label>
          <input
            id="admin-gallery-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by title or description"
            className={SELECT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="admin-gallery-status" className={LABEL_CLASSES}>
            Status
          </label>
          <select
            id="admin-gallery-status"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Statuses</option>
            {GALLERY_ALBUM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {GALLERY_ALBUM_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-gallery-archive" className={LABEL_CLASSES}>
            Archive
          </label>
          <select
            id="admin-gallery-archive"
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
          <label htmlFor="admin-gallery-featured" className={LABEL_CLASSES}>
            Featured
          </label>
          <select
            id="admin-gallery-featured"
            value={featured}
            onChange={(event) => updateParams({ featured: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All</option>
            <option value="featured">Featured</option>
            <option value="not-featured">Not Featured</option>
          </select>
        </div>

        <div>
          <label htmlFor="admin-gallery-sort" className={LABEL_CLASSES}>
            Sort
          </label>
          <select
            id="admin-gallery-sort"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="newest">Newest Created</option>
            <option value="oldest">Oldest Created</option>
            <option value="title-asc">Title (A–Z)</option>
            <option value="title-desc">Title (Z–A)</option>
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
