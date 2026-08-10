interface RankedListItem {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  valueLabel?: string;
}

interface RankedListProps {
  title: string;
  items: RankedListItem[];
  emptyMessage?: string;
}

/** Numbered "top N" list — used for most borrowed instruments, most active borrowers, etc. */
export default function RankedList({ title, items, emptyMessage = "No data available." }: RankedListProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#111111]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#666666]">{emptyMessage}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-t border-[#E8E8E8] pt-2 first:border-t-0 first:pt-0"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F8F8F6] text-[10px] font-semibold text-[#666666]">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-[#111111]">{item.label}</span>
                  {item.sublabel && (
                    <span className="block truncate text-xs text-[#666666]">{item.sublabel}</span>
                  )}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-[#C8A928]">
                {item.valueLabel ?? item.value}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
