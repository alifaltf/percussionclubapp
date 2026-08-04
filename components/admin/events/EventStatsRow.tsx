import SummaryCard from "@/components/dashboard/SummaryCard";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  SwapIcon,
} from "@/components/ui/icons";
import type { EventStats } from "@/types/event";

interface EventStatsRowProps {
  stats: EventStats;
}

export default function EventStatsRow({ stats }: EventStatsRowProps) {
  const items = [
    { label: "Total Events", value: stats.total, icon: <CalendarIcon className="h-5 w-5" /> },
    { label: "Draft", value: stats.draft, icon: <ClockIcon className="h-5 w-5" /> },
    { label: "Published", value: stats.published, icon: <CheckCircleIcon className="h-5 w-5" /> },
    { label: "Upcoming", value: stats.upcoming, icon: <SwapIcon className="h-5 w-5" /> },
    { label: "Archived", value: stats.archived, icon: <AlertTriangleIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <SummaryCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
