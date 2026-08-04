const THUMBNAILS = Array.from({ length: 8 });

export default function AlbumDetailLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl" aria-hidden="true">
        <div className="h-4 w-32 animate-pulse rounded bg-[#E8E8E8]" />

        <div className="mt-8">
          <div className="h-3 w-24 animate-pulse rounded bg-[#E8E8E8]" />
          <div className="mt-3 h-9 w-2/3 animate-pulse rounded bg-[#E8E8E8]" />
          <div className="mt-4 h-4 w-40 animate-pulse rounded bg-[#E8E8E8]" />
          <div className="mt-6 h-16 w-full max-w-2xl animate-pulse rounded bg-[#E8E8E8]" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {THUMBNAILS.map((_, index) => (
            <div key={index} className="aspect-square animate-pulse border border-[#E8E8E8] bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
