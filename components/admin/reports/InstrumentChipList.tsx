import Badge from "@/components/ui/Badge";

interface InstrumentChipListItem {
  id: string;
  name: string;
  instrumentCode: string;
  meta?: string;
}

interface InstrumentChipListProps {
  title: string;
  items: InstrumentChipListItem[];
  emptyMessage?: string;
}

/** Plain instrument list — used for "never borrowed" and "damaged / maintenance". */
export default function InstrumentChipList({
  title,
  items,
  emptyMessage = "None.",
}: InstrumentChipListProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#111111]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#666666]">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-t border-[#E8E8E8] pt-2 first:border-t-0 first:pt-0"
            >
              <span className="min-w-0 truncate text-sm text-[#111111]">
                {item.name} <span className="text-xs text-[#666666]">({item.instrumentCode})</span>
              </span>
              {item.meta && (
                <Badge variant="default" className="shrink-0">
                  {item.meta}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
