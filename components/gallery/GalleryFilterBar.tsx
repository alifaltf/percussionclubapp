"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";

const SELECT_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";
const SEARCH_DEBOUNCE_MS = 350;

interface GalleryFilterBarProps {
  years: string[];
  events: { id: string; title: string }[];
}

export default function GalleryFilterBar({ years, events }: GalleryFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const featured = searchParams.get("featured") ?? "all";
  const year = searchParams.get("year") ?? "all";
  const eventId = searchParams.get("event") ?? "all";

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
    search.trim() !== "" || featured !== "all" || year !== "all" || eventId !== "all";

  function resetFilters() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch("");
    router.push(pathname);
  }

  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="gallery-search" className={LABEL_CLASSES}>
            Search
          </label>
          <input
            id="gallery-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by album title or description"
            className={SELECT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="gallery-featured" className={LABEL_CLASSES}>
            Featured
          </label>
          <select
            id="gallery-featured"
            value={featured}
            onChange={(event) => updateParams({ featured: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Albums</option>
            <option value="featured">Featured Only</option>
          </select>
        </div>

        <div>
          <label htmlFor="gallery-year" className={LABEL_CLASSES}>
            Year
          </label>
          <select
            id="gallery-year"
            value={year}
            onChange={(event) => updateParams({ year: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Years</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="gallery-event" className={LABEL_CLASSES}>
            Related Event
          </label>
          <select
            id="gallery-event"
            value={eventId}
            onChange={(event) => updateParams({ event: event.target.value })}
            className={SELECT_CLASSES}
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
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
