"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { InstrumentIcon } from "@/components/ui/icons";
import InstrumentCard from "@/components/instruments/InstrumentCard";
import InstrumentFilters, {
  type FilterValue,
} from "@/components/instruments/InstrumentFilters";
import type {
  Instrument,
  InstrumentCondition,
  InstrumentStatus,
} from "@/types/instrument";

interface InstrumentBrowserProps {
  instruments: Instrument[];
}

export default function InstrumentBrowser({ instruments }: InstrumentBrowserProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterValue<InstrumentStatus>>("all");
  const [condition, setCondition] = useState<FilterValue<InstrumentCondition>>("all");
  const [category, setCategory] = useState<FilterValue<string>>("all");

  const categories = useMemo(() => {
    const unique = new Set(instruments.map((instrument) => instrument.category));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [instruments]);

  const hasActiveFilters =
    search.trim() !== "" || status !== "all" || condition !== "all" || category !== "all";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return instruments.filter((instrument) => {
      const matchesQuery =
        !query ||
        instrument.instrument_code.toLowerCase().includes(query) ||
        instrument.name.toLowerCase().includes(query) ||
        instrument.category.toLowerCase().includes(query);
      const matchesStatus = status === "all" || instrument.status === status;
      const matchesCondition = condition === "all" || instrument.condition === condition;
      const matchesCategory = category === "all" || instrument.category === category;

      return matchesQuery && matchesStatus && matchesCondition && matchesCategory;
    });
  }, [instruments, search, status, condition, category]);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setCondition("all");
    setCategory("all");
  };

  return (
    <div>
      <InstrumentFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        condition={condition}
        onConditionChange={setCondition}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      <p className="mt-6 text-sm text-[#666666]">
        {filtered.length} {filtered.length === 1 ? "instrument" : "instruments"} found
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<InstrumentIcon className="h-5 w-5" />}
            title="No instruments match your filters"
            description="Try adjusting your search or filters to see more results."
            action={
              <Button type="button" variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((instrument) => (
            <InstrumentCard key={instrument.id} instrument={instrument} />
          ))}
        </div>
      )}
    </div>
  );
}
