const SKELETON_CARDS = Array.from({ length: 5 });

export default function AnnouncementsSkeletonList() {
  return (
    <div aria-hidden="true">
      <div className="h-[140px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />

      <div className="mt-6 space-y-4">
        {SKELETON_CARDS.map((_, index) => (
          <div key={index} className="border border-[#E8E8E8] bg-white p-6">
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-[#E8E8E8]" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-[#E8E8E8]" />
            </div>
            <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-1 h-4 w-1/2 animate-pulse rounded bg-[#E8E8E8]" />
          </div>
        ))}
      </div>
    </div>
  );
}
