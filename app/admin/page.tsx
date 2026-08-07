import Badge from "@/components/ui/Badge";
import SummaryCard from "@/components/dashboard/SummaryCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import ListCard from "@/components/dashboard/ListCard";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  GalleryIcon,
  InstrumentIcon,
  MegaphoneIcon,
  PlusIcon,
  StarIcon,
  SwapIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getInstrumentStats } from "@/lib/supabase/instruments";
import { getBorrowRequestStats } from "@/lib/supabase/borrow-requests";
import { getEventStats } from "@/lib/supabase/events";
import { getGalleryStats } from "@/lib/supabase/gallery";
import { getAnnouncementStats } from "@/lib/supabase/announcements";
import { RECENT_ACTIVITY, TOTAL_MEMBERS } from "@/app/admin/data";

const QUICK_ACTIONS = [
  {
    label: "Manage Instruments",
    href: "/admin/instruments",
    icon: <InstrumentIcon className="h-5 w-5" />,
  },
  {
    label: "Add Instrument",
    href: "/admin/instruments/new",
    icon: <PlusIcon className="h-5 w-5" />,
  },
  {
    label: "Manage Members",
    href: "/admin/members",
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    label: "Review Borrow Requests",
    href: "/admin/requests",
    icon: <SwapIcon className="h-5 w-5" />,
  },
  {
    label: "Manage Events",
    href: "/admin/events",
    icon: <CalendarIcon className="h-5 w-5" />,
  },
  {
    label: "Manage Gallery",
    href: "/admin/gallery",
    icon: <GalleryIcon className="h-5 w-5" />,
  },
  {
    label: "Manage Announcements",
    href: "/admin/announcements",
    icon: <MegaphoneIcon className="h-5 w-5" />,
  },
];

export default async function AdminDashboardPage() {
  const { profile } = await requireAdmin();
  const displayName = profile?.full_name || "Admin";

  let statsError = false;
  let instrumentStats: Awaited<ReturnType<typeof getInstrumentStats>> | null = null;
  let requestStats: Awaited<ReturnType<typeof getBorrowRequestStats>> | null = null;
  let eventStats: Awaited<ReturnType<typeof getEventStats>> | null = null;
  let galleryStats: Awaited<ReturnType<typeof getGalleryStats>> | null = null;
  let announcementStats: Awaited<ReturnType<typeof getAnnouncementStats>> | null = null;

  try {
    [instrumentStats, requestStats, eventStats, galleryStats, announcementStats] = await Promise.all([
      getInstrumentStats(),
      getBorrowRequestStats(),
      getEventStats(),
      getGalleryStats(),
      getAnnouncementStats(),
    ]);
  } catch {
    statsError = true;
  }

  // getBorrowRequestStats keys its counts by *effective* status — "active"
  // there means "out, not yet overdue", with overdue broken out
  // separately. "Active Borrowings" on this dashboard means everything
  // currently checked out regardless of due date, so it's the sum of both.
  const activeBorrowings = (requestStats?.active ?? 0) + (requestStats?.overdue ?? 0);

  const statCards = [
    { label: "Total Members", value: TOTAL_MEMBERS, icon: <UsersIcon className="h-5 w-5" /> },
    {
      label: "Total Instruments",
      value: instrumentStats?.total ?? "—",
      icon: <InstrumentIcon className="h-5 w-5" />,
    },
    {
      label: "Available Instruments",
      value: instrumentStats?.available ?? "—",
      icon: <CheckCircleIcon className="h-5 w-5" />,
    },
    {
      label: "Borrowed Instruments",
      value: instrumentStats?.borrowed ?? "—",
      icon: <SwapIcon className="h-5 w-5" />,
    },
    {
      label: "Pending Requests",
      value: requestStats?.pending ?? "—",
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      label: "Damaged Instruments",
      value: instrumentStats?.damaged ?? "—",
      icon: <AlertTriangleIcon className="h-5 w-5" />,
    },
    {
      label: "Active Borrowings",
      value: requestStats ? activeBorrowings : "—",
      icon: <SwapIcon className="h-5 w-5" />,
    },
    {
      label: "Overdue Borrowings",
      value: requestStats?.overdue ?? "—",
      icon: <AlertTriangleIcon className="h-5 w-5" />,
    },
    {
      label: "Returns Awaiting Review",
      value: requestStats?.return_submitted ?? "—",
      icon: <CameraIcon className="h-5 w-5" />,
    },
    {
      label: "Upcoming Events",
      value: eventStats?.upcoming ?? "—",
      icon: <CalendarIcon className="h-5 w-5" />,
    },
    {
      label: "Draft Events",
      value: eventStats?.draft ?? "—",
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      label: "Published Events",
      value: eventStats?.published ?? "—",
      icon: <CheckCircleIcon className="h-5 w-5" />,
    },
    {
      label: "Total Albums",
      value: galleryStats?.totalAlbums ?? "—",
      icon: <GalleryIcon className="h-5 w-5" />,
    },
    {
      label: "Published Albums",
      value: galleryStats?.published ?? "—",
      icon: <CheckCircleIcon className="h-5 w-5" />,
    },
    {
      label: "Draft Albums",
      value: galleryStats?.draft ?? "—",
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      label: "Total Gallery Images",
      value: galleryStats?.totalImages ?? "—",
      icon: <CameraIcon className="h-5 w-5" />,
    },
    {
      label: "Published Announcements",
      value: announcementStats?.published ?? "—",
      icon: <CheckCircleIcon className="h-5 w-5" />,
    },
    {
      label: "Draft Announcements",
      value: announcementStats?.draft ?? "—",
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      label: "Urgent Announcements",
      value: announcementStats?.urgent ?? "—",
      icon: <AlertTriangleIcon className="h-5 w-5" />,
    },
    {
      label: "Pinned Announcements",
      value: announcementStats?.pinned ?? "—",
      icon: <StarIcon className="h-5 w-5" />,
    },
  ];

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Admin
          </span>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              Admin Dashboard
            </h1>
            <Badge variant="gold">Admin</Badge>
          </div>
          <p className="mt-2 text-sm text-[#666666]">Welcome back, {displayName}</p>
          <p className="mt-1 text-sm text-[#666666]">
            Manage the IIUM Percussion Club system.
          </p>
        </div>

        {statsError && (
          <p className="mt-6 text-sm text-red-600">
            Some statistics couldn&apos;t be loaded right now.
          </p>
        )}

        {/* Statistics cards */}
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
          {statCards.map((stat) => (
            <SummaryCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-12">
          <h2 className="font-serif text-xl font-semibold text-[#111111]">
            Quick Actions
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.href}
                icon={action.icon}
                label={action.label}
                href={action.href}
              />
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-12 max-w-2xl">
          <ListCard
            title="Recent Activity"
            icon={<ClockIcon className="h-4 w-4" />}
            items={RECENT_ACTIVITY}
          />
        </div>
      </div>
    </main>
  );
}
