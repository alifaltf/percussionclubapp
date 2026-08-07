import AdminAnnouncementsSkeleton from "@/components/admin/announcements/AdminAnnouncementsSkeleton";

export default function AdminAnnouncementsLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Admin
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            Announcements
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#666666]">
            Post club news, reminders and updates for members.
          </p>
        </div>

        <div className="mt-10">
          <AdminAnnouncementsSkeleton />
        </div>
      </div>
    </main>
  );
}
