import Badge from "@/components/ui/Badge";
import { ANNOUNCEMENT_PRIORITY_LABELS, type AnnouncementPriority } from "@/types/announcement";

const VARIANT_MAP: Record<AnnouncementPriority, "default" | "warning" | "danger"> = {
  normal: "default",
  important: "warning",
  urgent: "danger",
};

interface PriorityBadgeProps {
  priority: AnnouncementPriority;
  className?: string;
}

export default function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[priority]} className={className}>
      {ANNOUNCEMENT_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
