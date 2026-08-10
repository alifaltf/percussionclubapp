"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyChartState from "@/components/admin/reports/charts/EmptyChartState";
import type { InstrumentCount } from "@/types/report";

interface TopBorrowedInstrumentsChartProps {
  data: InstrumentCount[];
}

export default function TopBorrowedInstrumentsChart({ data }: TopBorrowedInstrumentsChartProps) {
  if (data.length === 0) {
    return <EmptyChartState />;
  }

  const summary = data.map((item) => `${item.name}: ${item.count}`).join(", ");

  return (
    <div>
      <div
        role="img"
        aria-label={`Top borrowed instruments in the selected period. ${summary}.`}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke="#E8E8E8" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "#666666", fontSize: 11 }}
              axisLine={{ stroke: "#E8E8E8" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: "#111111", fontSize: 11 }}
              axisLine={{ stroke: "#E8E8E8" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "#F8F8F6" }}
              contentStyle={{ borderColor: "#E8E8E8", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="count" name="Times Borrowed" fill="#C8A928" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[#666666]">{summary}.</p>
    </div>
  );
}
