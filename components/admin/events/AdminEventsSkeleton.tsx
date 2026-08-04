const STAT_CARDS = Array.from({ length: 5 });
const ROW_COUNT = 8;

export default function AdminEventsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((_, index) => (
          <div
            key={index}
            className="h-[76px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white"
          />
        ))}
      </div>

      <div className="mt-8 h-[92px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
        <div className="h-11 border-b border-[#E8E8E8] bg-[#F8F8F6]" />
        <div className="divide-y divide-[#E8E8E8]">
          {Array.from({ length: ROW_COUNT }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
