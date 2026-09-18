import Badge from "@/components/ui/Badge";
import { CONDITION_LABELS, type InstrumentCondition } from "@/types/instrument";

// excellent/good are unremarkable, fair is worth a second look, poor is a
// genuine problem — mirrors the severity treatment in StatusBadge.
const VARIANT_BY_CONDITION: Record<InstrumentCondition, "default" | "gold" | "warning" | "danger"> = {
  excellent: "gold",
  good: "default",
  fair: "warning",
  poor: "danger",
};

interface ConditionBadgeProps {
  condition: InstrumentCondition;
  className?: string;
}

export default function ConditionBadge({
  condition,
  className = "",
}: ConditionBadgeProps) {
  return (
    <Badge variant={VARIANT_BY_CONDITION[condition]} className={className}>
      {CONDITION_LABELS[condition]}
    </Badge>
  );
}
