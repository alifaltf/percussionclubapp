import Badge from "@/components/ui/Badge";
import { CONDITION_LABELS, type InstrumentCondition } from "@/types/instrument";

interface ConditionBadgeProps {
  condition: InstrumentCondition;
  className?: string;
}

export default function ConditionBadge({
  condition,
  className = "",
}: ConditionBadgeProps) {
  return (
    <Badge
      variant={condition === "excellent" ? "gold" : "default"}
      className={className}
    >
      {CONDITION_LABELS[condition]}
    </Badge>
  );
}
