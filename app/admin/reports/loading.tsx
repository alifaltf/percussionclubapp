const SUMMARY_CARDS = Array.from({ length: 12 });
const SECTIONS = Array.from({ length: 4 });

export default function ReportsLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20" aria-hidden="true">
      <div className="mx-auto w-full max-w-6xl">
        <div className="h-4 w-16 animate-pulse rounded bg-[#E8E8E8]" />
        <div className="mt-3 h-9 w-64 animate-pulse rounded bg-[#E8E8E8]" />

        <div className="mt-8 h-24 animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />

        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {SUMMARY_CARDS.map((_, index) => (
            <div
              key={index}
              className="h-[76px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white"
            />
          ))}
        </div>

        {SECTIONS.map((_, index) => (
          <div key={index} className="mt-12">
            <div className="h-6 w-40 animate-pulse rounded bg-[#E8E8E8]" />
            <div className="mt-5 h-64 animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />
          </div>
        ))}
      </div>
    </main>
  );
}
