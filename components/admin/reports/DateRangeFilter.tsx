"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { REPORT_DATE_RANGE_OPTIONS, type ReportDateRangeKey } from "@/types/report";

const SELECT_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

export default function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRange = (searchParams.get("range") as ReportDateRangeKey) || "90";
  const [range, setRange] = useState<ReportDateRangeKey>(currentRange);
  const [start, setStart] = useState(searchParams.get("start") ?? "");
  const [end, setEnd] = useState(searchParams.get("end") ?? "");

  function apply(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("range", range);
    if (range === "custom") {
      if (start) params.set("start", start);
      if (end) params.set("end", end);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-4 rounded-2xl border border-[#E8E8E8] bg-white p-5"
    >
      <div>
        <label htmlFor="report-range" className={LABEL_CLASSES}>
          Date Range
        </label>
        <select
          id="report-range"
          value={range}
          onChange={(event) => setRange(event.target.value as ReportDateRangeKey)}
          className={SELECT_CLASSES}
        >
          {REPORT_DATE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {range === "custom" && (
        <>
          <div>
            <label htmlFor="report-start" className={LABEL_CLASSES}>
              From
            </label>
            <input
              id="report-start"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className={SELECT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="report-end" className={LABEL_CLASSES}>
              To
            </label>
            <input
              id="report-end"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className={SELECT_CLASSES}
            />
          </div>
        </>
      )}

      <Button type="submit" variant="primary">
        Apply
      </Button>

      <p className="w-full text-xs text-[#666666]">
        Applies to borrowing, event and member-activity trends below. Instrument condition/status
        and lifetime totals always reflect the current state.
      </p>
    </form>
  );
}
