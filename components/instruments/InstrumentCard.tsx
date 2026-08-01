import Link from "next/link";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import StatusBadge from "@/components/instruments/StatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import type { Instrument } from "@/types/instrument";

interface InstrumentCardProps {
  instrument: Instrument;
}

export default function InstrumentCard({ instrument }: InstrumentCardProps) {
  return (
    <Link href={`/instruments/${instrument.id}`} className="group block">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#C8A928]/40 group-hover:shadow-sm">
        <InstrumentImage
          src={instrument.image_url}
          alt={instrument.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[4/3] w-full"
        />

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
              {instrument.instrument_code}
            </span>
            <StatusBadge status={instrument.status} />
          </div>

          <h3 className="font-serif text-lg font-semibold leading-snug text-[#111111]">
            {instrument.name}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="text-sm text-[#666666]">{instrument.category}</span>
            <ConditionBadge condition={instrument.condition} />
          </div>
        </div>
      </div>
    </Link>
  );
}
