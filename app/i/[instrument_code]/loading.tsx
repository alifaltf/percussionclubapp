export default function PublicInstrumentLoading() {
  return (
    <main
      className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-12 sm:py-16"
      aria-hidden="true"
    >
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <div className="aspect-square w-full animate-pulse bg-[#F8F8F6]" />
          <div className="p-6 sm:p-8">
            <div className="h-3 w-20 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-4 h-7 w-2/3 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-3 h-4 w-28 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-6 h-9 w-32 animate-pulse rounded bg-[#E8E8E8]" />
          </div>
        </div>
      </div>
    </main>
  );
}
