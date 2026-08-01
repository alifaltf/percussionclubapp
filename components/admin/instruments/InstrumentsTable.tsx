"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/Table";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import StatusBadge from "@/components/instruments/StatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import ArchiveStateBadge from "@/components/admin/instruments/ArchiveStateBadge";
import ArchiveInstrumentButton from "@/components/admin/instruments/ArchiveInstrumentButton";
import InstrumentAdminCard from "@/components/admin/instruments/InstrumentAdminCard";
import { bulkArchiveInstruments } from "@/app/admin/instruments/actions";
import type { Instrument } from "@/types/instrument";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

interface InstrumentsTableProps {
  instruments: Instrument[];
}

export default function InstrumentsTable({ instruments }: InstrumentsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [bulkError, setBulkError] = useState<string | null>(null);

  const allSelected = instruments.length > 0 && selected.size === instruments.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(instruments.map((instrument) => instrument.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkArchive() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Archive ${selected.size} instrument(s)? They will no longer be visible to members.`,
    );
    if (!confirmed) return;

    setBulkError(null);
    startTransition(async () => {
      const result = await bulkArchiveInstruments(Array.from(selected));
      if (result.status === "error") {
        setBulkError(result.message);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#E8E8E8] bg-[#F8F8F6] px-4 py-2.5">
          <span className="text-sm text-[#111111]">{selected.size} selected</span>
          <div className="flex items-center gap-3">
            {bulkError && <span className="text-xs text-red-600">{bulkError}</span>}
            <Button type="button" variant="outline" onClick={handleBulkArchive} disabled={isPending}>
              {isPending ? "Archiving..." : "Archive Selected"}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all instruments"
                />
              </TableHeadCell>
              <TableHeadCell className="w-16">Image</TableHeadCell>
              <TableHeadCell>Code</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Category</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Condition</TableHeadCell>
              <TableHeadCell>Archive</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell className="text-right">Actions</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instruments.map((instrument) => {
              const isArchived = Boolean(instrument.archived_at);
              return (
                <TableRow key={instrument.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(instrument.id)}
                      onChange={() => toggleOne(instrument.id)}
                      aria-label={`Select ${instrument.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <InstrumentImage
                      src={instrument.image_url}
                      alt={instrument.name}
                      sizes="48px"
                      className="h-12 w-12 rounded-sm"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-[#C8A928]">
                    {instrument.instrument_code}
                  </TableCell>
                  <TableCell>{instrument.name}</TableCell>
                  <TableCell className="text-[#666666]">{instrument.category}</TableCell>
                  <TableCell>
                    <StatusBadge status={instrument.status} />
                  </TableCell>
                  <TableCell>
                    <ConditionBadge condition={instrument.condition} />
                  </TableCell>
                  <TableCell>
                    <ArchiveStateBadge isArchived={isArchived} />
                  </TableCell>
                  <TableCell className="text-[#666666]">
                    {DATE_FORMATTER.format(new Date(instrument.created_at))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/instruments/${instrument.id}/edit`}
                        className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
                      >
                        Edit
                      </Link>
                      <ArchiveInstrumentButton
                        instrumentId={instrument.id}
                        instrumentName={instrument.name}
                        isArchived={isArchived}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / narrow-screen card layout */}
      <div className="space-y-3 lg:hidden">
        <label className="flex items-center gap-2 px-1 text-sm text-[#666666]">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select all
        </label>
        {instruments.map((instrument) => (
          <InstrumentAdminCard
            key={instrument.id}
            instrument={instrument}
            selected={selected.has(instrument.id)}
            onToggleSelect={toggleOne}
          />
        ))}
      </div>
    </div>
  );
}
