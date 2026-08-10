"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyChartState from "@/components/admin/reports/charts/EmptyChartState";
import type { MemberCount } from "@/types/report";

interface MemberActivityChartProps {
  data: MemberCount[];
}

/**
 * "Member Borrowing Activity" — counts are strictly derived from
 * borrow_requests rows in the selected date range. This is borrowing
 * activity, not account/login activity (the schema has no such field).
 */
export default function MemberActivityChart({ data }: MemberActivityChartProps) {
  if (data.length === 0) {
    return <EmptyChartState />;
  }

  const summary = data.map((item) => `${item.name}: ${item.count}`).join(", ");

  return (
    <div>
      <div
        role="img"
        aria-label={`Member borrowing activity in the selected period, by number of requests. ${summary}.`}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 24 }}>
            <CartesianGrid stroke="#E8E8E8" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#666666", fontSize: 10 }}
              axisLine={{ stroke: "#E8E8E8" }}
              tickLine={false}
              angle={-30}
              textAnchor="end"
              interval={0}
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
            <Bar dataKey="count" name="Borrow Requests" fill="#111111" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[#666666]">{summary}.</p>
    </div>
  );
}
