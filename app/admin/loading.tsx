import AdminDashboardSkeleton from "@/components/admin/AdminDashboardSkeleton";

export default function AdminDashboardLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Admin
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            Admin Dashboard
          </h1>
        </div>

        <div className="mt-10">
          <AdminDashboardSkeleton />
        </div>
      </div>
    </main>
  );
}
