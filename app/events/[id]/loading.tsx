export default function EventDetailLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-4xl" aria-hidden="true">
        <div className="h-4 w-32 animate-pulse rounded bg-[#E8E8E8]" />

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <div className="aspect-[16/9] w-full animate-pulse bg-[#F8F8F6]" />
          <div className="space-y-4 p-6 sm:p-10">
            <div className="h-3 w-24 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-6 grid grid-cols-1 gap-6 border-t border-[#E8E8E8] pt-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded bg-[#E8E8E8]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
