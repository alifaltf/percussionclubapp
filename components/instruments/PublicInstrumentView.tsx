import type { ReactNode } from "react";
import InstrumentImage from "@/components/instruments/InstrumentImage";
import StatusBadge from "@/components/instruments/StatusBadge";
import ConditionBadge from "@/components/instruments/ConditionBadge";
import type { InstrumentCondition, InstrumentStatus } from "@/types/instrument";

interface PublicInstrumentViewProps {
  instrument: {
    instrument_code: string;
    name: string;
    category: string;
    image_url: string | null;
    status: InstrumentStatus;
    condition: InstrumentCondition;
  };
  /** Role-specific actions (login CTA, borrow form, admin links) rendered below the identity block. */
  children?: ReactNode;
}

/**
 * The shared identification block shown on the public QR-scan page
 * (/i/[instrument_code]) for every visitor regardless of role — image,
 * code, name, category, status and condition, and nothing else. Callers
 * append role-specific actions as children rather than this component
 * branching on auth/role itself, keeping it safe to reuse for the
 * logged-out view (which must only ever receive the restricted
 * PublicInstrument shape).
 */
export default function PublicInstrumentView({
  instrument,
  children,
}: PublicInstrumentViewProps) {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <InstrumentImage
            src={instrument.image_url}
            alt={instrument.name}
            sizes="(min-width: 640px) 448px, 100vw"
            className="aspect-square w-full"
            priority
          />

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
                {instrument.instrument_code}
              </span>
              <StatusBadge status={instrument.status} />
              <ConditionBadge condition={instrument.condition} />
            </div>

            <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
              {instrument.name}
            </h1>
            <p className="mt-1 text-sm text-[#666666]">{instrument.category}</p>

            {children && (
              <div className="mt-6 border-t border-[#E8E8E8] pt-6">{children}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
