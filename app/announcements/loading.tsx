import AnnouncementsSkeletonList from "@/components/announcements/AnnouncementsSkeletonList";

export default function AnnouncementsLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          IIUM Percussion Club
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          Announcements
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          Club news, reminders and updates for members.
        </p>

        <div className="mt-10">
          <AnnouncementsSkeletonList />
        </div>
      </div>
    </main>
  );
}
