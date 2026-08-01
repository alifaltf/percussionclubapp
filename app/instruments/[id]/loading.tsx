export default function InstrumentDetailLoading() {
  return (
    <main
      className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20"
      aria-hidden="true"
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="h-4 w-40 animate-pulse rounded bg-[#E8E8E8]" />

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <div className="aspect-[16/9] w-full animate-pulse bg-[#F8F8F6]" />

          <div className="p-6 sm:p-10">
            <div className="h-3 w-24 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-3 h-4 w-32 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-8 h-4 w-full max-w-md animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-2 h-4 w-full max-w-sm animate-pulse rounded bg-[#E8E8E8]" />
          </div>
        </div>
      </div>
    </main>
  );
}
