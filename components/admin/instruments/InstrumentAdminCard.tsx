import Link from "next/link";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import StatusBadge from "@/components/instruments/StatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import ArchiveStateBadge from "@/components/admin/instruments/ArchiveStateBadge";
import ArchiveInstrumentButton from "@/components/admin/instruments/ArchiveInstrumentButton";
import type { Instrument } from "@/types/instrument";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

interface InstrumentAdminCardProps {
  instrument: Instrument;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

export default function InstrumentAdminCard({
  instrument,
  selected,
  onToggleSelect,
}: InstrumentAdminCardProps) {
  const isArchived = Boolean(instrument.archived_at);

  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4">
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(instrument.id)}
          aria-label={`Select ${instrument.name}`}
          className="mt-1 shrink-0"
        />
        <InstrumentImage
          src={instrument.image_url}
          alt={instrument.name}
          sizes="64px"
          className="h-16 w-16 shrink-0 rounded-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
            {instrument.instrument_code}
          </p>
          <p className="truncate font-serif text-base font-semibold text-[#111111]">
            {instrument.name}
          </p>
          <p className="text-xs text-[#666666]">{instrument.category}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={instrument.status} />
            <ConditionBadge condition={instrument.condition} />
            <ArchiveStateBadge isArchived={isArchived} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#E8E8E8] pt-3">
        <span className="text-xs text-[#666666]">
          Created {DATE_FORMATTER.format(new Date(instrument.created_at))}
        </span>
        <div className="flex items-center gap-4">
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
      </div>
    </div>
  );
}
