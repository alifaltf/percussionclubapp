import Badge from "@/components/ui/Badge";
import { ANNOUNCEMENT_STATUS_LABELS, type AnnouncementStatus } from "@/types/announcement";

const VARIANT_MAP: Record<AnnouncementStatus, "default" | "gold"> = {
  draft: "default",
  published: "gold",
};

interface AnnouncementStatusBadgeProps {
  status: AnnouncementStatus;
  className?: string;
}

export default function AnnouncementStatusBadge({
  status,
  className = "",
}: AnnouncementStatusBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[status]} className={className}>
      {ANNOUNCEMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
