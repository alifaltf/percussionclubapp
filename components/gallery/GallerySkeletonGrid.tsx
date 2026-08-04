const SKELETON_CARDS = Array.from({ length: 6 });

export default function GallerySkeletonGrid() {
  return (
    <div aria-hidden="true">
      <div className="h-[140px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />

      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {SKELETON_CARDS.map((_, index) => (
          <div key={index} className="overflow-hidden border border-[#E8E8E8] bg-white">
            <div className="aspect-[4/3] w-full animate-pulse bg-[#F8F8F6]" />
            <div className="flex flex-col gap-3 p-6">
              <div className="h-3 w-24 animate-pulse rounded bg-[#E8E8E8]" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#E8E8E8]" />
              <div className="h-3 w-32 animate-pulse rounded bg-[#E8E8E8]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
