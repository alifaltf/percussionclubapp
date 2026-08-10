"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyChartState from "@/components/admin/reports/charts/EmptyChartState";
import type { DistributionItem } from "@/types/report";

interface InstrumentConditionBarChartProps {
  data: DistributionItem[];
}

export default function InstrumentConditionBarChart({ data }: InstrumentConditionBarChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return <EmptyChartState />;
  }

  const summary = data.map((item) => `${item.label}: ${item.count}`).join(", ");

  return (
    <div>
      <div
        role="img"
        aria-label={`Instrument condition distribution out of ${total} total. ${summary}.`}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#E8E8E8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#666666", fontSize: 11 }}
              axisLine={{ stroke: "#E8E8E8" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#666666", fontSize: 11 }}
              axisLine={{ stroke: "#E8E8E8" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "#F8F8F6" }}
              contentStyle={{ borderColor: "#E8E8E8", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="count" name="Instruments" fill="#9E8217" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[#666666]">{summary}.</p>
    </div>
  );
}
