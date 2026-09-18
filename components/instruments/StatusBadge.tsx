import Badge from "@/components/ui/Badge";
import { STATUS_LABELS, type InstrumentStatus } from "@/types/instrument";

// Severity mapping, mirroring components/borrowings/BorrowStatusBadge.tsx:
// available is the positive/normal state, borrowed is a neutral fact (not a
// problem), maintenance/not_ready are worth flagging, and damaged is the
// one genuinely problematic state. "pending" is legacy — see types/instrument.ts
// — kept as a visible warning rather than crashing on any row that still has it.
const VARIANT_BY_STATUS: Record<InstrumentStatus, "default" | "gold" | "warning" | "danger"> = {
  available: "gold",
  borrowed: "default",
  maintenance: "warning",
  not_ready: "warning",
  damaged: "danger",
  pending: "warning",
};

interface StatusBadgeProps {
  status: InstrumentStatus;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
