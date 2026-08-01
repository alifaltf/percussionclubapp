import Badge from "@/components/ui/Badge";
import { STATUS_LABELS, type InstrumentStatus } from "@/types/instrument";

interface StatusBadgeProps {
  status: InstrumentStatus;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <Badge variant={status === "available" ? "gold" : "default"} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
