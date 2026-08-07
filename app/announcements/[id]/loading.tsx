export default function AnnouncementDetailLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl" aria-hidden="true">
        <div className="h-4 w-40 animate-pulse rounded bg-[#E8E8E8]" />

        <div className="mt-6 border border-[#E8E8E8] bg-white p-8 sm:p-10">
          <div className="flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-[#E8E8E8]" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-[#E8E8E8]" />
          </div>
          <div className="mt-4 h-9 w-2/3 animate-pulse rounded bg-[#E8E8E8]" />
          <div className="mt-4 h-4 w-48 animate-pulse rounded bg-[#E8E8E8]" />
          <div className="mt-8 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[#E8E8E8]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#E8E8E8]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#E8E8E8]" />
          </div>
        </div>
      </div>
    </main>
  );
}
