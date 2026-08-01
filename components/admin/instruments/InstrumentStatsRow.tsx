import SummaryCard from "@/components/dashboard/SummaryCard";
import {
  AlertTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  InstrumentIcon,
  SwapIcon,
} from "@/components/ui/icons";
import type { InstrumentStats } from "@/types/instrument";

interface InstrumentStatsRowProps {
  stats: InstrumentStats;
}

export default function InstrumentStatsRow({ stats }: InstrumentStatsRowProps) {
  const items = [
    {
      label: "Total Instruments",
      value: stats.total,
      icon: <InstrumentIcon className="h-5 w-5" />,
    },
    {
      label: "Available",
      value: stats.available,
      icon: <CheckCircleIcon className="h-5 w-5" />,
    },
    {
      label: "Borrowed",
      value: stats.borrowed,
      icon: <SwapIcon className="h-5 w-5" />,
    },
    {
      label: "Damaged",
      value: stats.damaged,
      icon: <AlertTriangleIcon className="h-5 w-5" />,
    },
    {
      label: "Maintenance",
      value: stats.maintenance,
      icon: <ClockIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <SummaryCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  );
}
