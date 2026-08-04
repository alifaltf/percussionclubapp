import Badge from "@/components/ui/Badge";
import { EVENT_STATUS_LABELS, type EventStatus } from "@/types/event";

const VARIANT_BY_STATUS: Record<EventStatus, "default" | "gold" | "warning" | "danger"> = {
  draft: "default",
  published: "gold",
  cancelled: "danger",
  completed: "default",
};

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export default function EventStatusBadge({ status, className = "" }: EventStatusBadgeProps) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status]} className={className}>
      {EVENT_STATUS_LABELS[status]}
    </Badge>
  );
}
