"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyChartState from "@/components/admin/reports/charts/EmptyChartState";
import type { MonthlyCount } from "@/types/report";

interface BorrowingsByMonthChartProps {
  data: MonthlyCount[];
}

export default function BorrowingsByMonthChart({ data }: BorrowingsByMonthChartProps) {
  if (data.length === 0) {
    return <EmptyChartState />;
  }

  const peak = data.reduce((max, point) => (point.count > max.count ? point : max), data[0]);
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const summary = `${total} borrowing request${total === 1 ? "" : "s"} across ${data.length} month${data.length === 1 ? "" : "s"}. Busiest month: ${peak.label} with ${peak.count}.`;

  return (
    <div>
      <div role="img" aria-label={`Borrowings by month. ${summary}`} className="h-64 w-full">
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
            <Bar dataKey="count" name="Borrowing Requests" fill="#C8A928" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[#666666]">{summary}</p>
    </div>
  );
}
