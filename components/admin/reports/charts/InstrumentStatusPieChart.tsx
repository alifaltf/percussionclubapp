"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import EmptyChartState from "@/components/admin/reports/charts/EmptyChartState";
import type { DistributionItem } from "@/types/report";

interface InstrumentStatusPieChartProps {
  data: DistributionItem[];
}

// Brand-matched palette: gold shades plus neutral greys, avoiding bright
// colours per the design guidelines. Ordered to match INSTRUMENT_STATUSES.
const COLORS = ["#C8A928", "#9E8217", "#666666", "#B91C1C", "#111111", "#B8B8B8"];

export default function InstrumentStatusPieChart({ data }: InstrumentStatusPieChartProps) {
  const nonZero = data.filter((item) => item.count > 0);

  if (nonZero.length === 0) {
    return <EmptyChartState />;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const summary = nonZero.map((item) => `${item.label}: ${item.count}`).join(", ");

  return (
    <div>
      <div
        role="img"
        aria-label={`Instrument status distribution out of ${total} total. ${summary}.`}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderColor: "#E8E8E8", borderRadius: 8, fontSize: 12 }} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs text-[#111111]">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[#666666]">{summary}.</p>
    </div>
  );
}
