import Button from "@/components/ui/Button";
import { MegaphoneIcon } from "@/components/ui/icons";

export default function AdminAnnouncementNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#F8F8F6] px-6 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#C8A928]">
        <MegaphoneIcon className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-serif text-2xl font-semibold text-[#111111] sm:text-3xl">
        Announcement Not Found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[#666666]">
        This announcement doesn&apos;t exist or may have been removed.
      </p>
      <Button href="/admin/announcements" variant="outline" className="mt-6">
        Back to Announcements
      </Button>
    </main>
  );
}
