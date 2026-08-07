import SummaryCard from "@/components/dashboard/SummaryCard";
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, StarIcon } from "@/components/ui/icons";
import type { AnnouncementStats } from "@/types/announcement";

interface AnnouncementStatsRowProps {
  stats: AnnouncementStats;
}

export default function AnnouncementStatsRow({ stats }: AnnouncementStatsRowProps) {
  const items = [
    { label: "Published", value: stats.published, icon: <CheckCircleIcon className="h-5 w-5" /> },
    { label: "Draft", value: stats.draft, icon: <ClockIcon className="h-5 w-5" /> },
    { label: "Urgent", value: stats.urgent, icon: <AlertTriangleIcon className="h-5 w-5" /> },
    { label: "Pinned", value: stats.pinned, icon: <StarIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
      {items.map((item) => (
        <SummaryCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
