import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Badge from "@/components/ui/Badge";
import PriorityBadge from "@/components/announcements/PriorityBadge";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getPublicAnnouncementById } from "@/lib/supabase/announcements";
import { formatAnnouncementDate } from "@/utils/format-announcement";

interface AnnouncementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const announcement = await getPublicAnnouncementById(id);
  if (!announcement) {
    notFound();
  }

  const publishedLabel = formatAnnouncementDate(announcement.published_at);
  const expiresLabel = formatAnnouncementDate(announcement.expires_at);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Announcements
        </Link>

        <div className="mt-6 border border-[#E8E8E8] bg-white p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            {announcement.is_pinned && <Badge variant="gold">Pinned</Badge>}
            <PriorityBadge priority={announcement.priority} />
          </div>

          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            {announcement.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#666666]">
            {publishedLabel && <span>Published {publishedLabel}</span>}
            {expiresLabel && (
              <>
                <span aria-hidden="true" className="text-[#E8E8E8]">
                  •
                </span>
                <span>Expires {expiresLabel}</span>
              </>
            )}
          </div>

          <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-[#111111]">
            {announcement.content}
          </div>
        </div>
      </div>
    </main>
  );
}
