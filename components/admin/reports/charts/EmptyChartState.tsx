interface EmptyChartStateProps {
  message?: string;
}

/**
 * Shared empty state for every chart in this module. Rendered instead of an
 * empty/broken chart whenever the underlying query returns no rows, per the
 * "No data available" requirement.
 */
export default function EmptyChartState({ message = "No data available." }: EmptyChartStateProps) {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-[#E8E8E8] bg-[#F8F8F6]">
      <p className="text-sm text-[#666666]">{message}</p>
    </div>
  );
}
