import type { ReactNode } from "react";
import Card from "@/components/ui/Card";

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
}

export default function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] bg-[#F8F8F6] text-[#C8A928]">
        {icon}
      </span>
      <div>
        <p className="font-serif text-2xl font-semibold text-[#111111]">
          {value}
        </p>
        <p className="text-xs uppercase tracking-wide text-[#666666]">
          {label}
        </p>
      </div>
    </Card>
  );
}
