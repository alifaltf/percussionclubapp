import Badge from "@/components/ui/Badge";

interface ArchiveStateBadgeProps {
  isArchived: boolean;
  className?: string;
}

export default function ArchiveStateBadge({
  isArchived,
  className = "",
}: ArchiveStateBadgeProps) {
  return (
    <Badge variant={isArchived ? "default" : "gold"} className={className}>
      {isArchived ? "Archived" : "Active"}
    </Badge>
  );
}
