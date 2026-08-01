const STAT_CARDS = Array.from({ length: 6 });
const ACTION_CARDS = Array.from({ length: 6 });

export default function AdminDashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map((_, index) => (
          <div
            key={index}
            className="h-[76px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white"
          />
        ))}
      </div>

      <div className="mt-12">
        <div className="h-6 w-32 animate-pulse rounded bg-[#E8E8E8]" />
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACTION_CARDS.map((_, index) => (
            <div
              key={index}
              className="h-[104px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white"
            />
          ))}
        </div>
      </div>

      <div className="mt-12 max-w-2xl">
        <div className="h-48 animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />
      </div>
    </div>
  );
}
