import { redirect } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LogoutButton from "@/components/LogoutButton";
import SummaryCard from "@/components/dashboard/SummaryCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import ListCard from "@/components/dashboard/ListCard";
import AnnouncementsListCard from "@/components/dashboard/AnnouncementsListCard";
import {
  CalendarIcon,
  ClockIcon,
  InstrumentIcon,
  MegaphoneIcon,
  PlusIcon,
  SwapIcon,
} from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getInstrumentStats } from "@/lib/supabase/instruments";
import { getMyBorrowStats } from "@/lib/supabase/borrow-requests";
import { getLatestDashboardAnnouncements } from "@/lib/supabase/announcements";
import { UPCOMING_EVENTS, UPCOMING_EVENTS_COUNT } from "@/app/dashboard/data";
import type { Announcement } from "@/types/announcement";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = profile?.role === "admin";
  const displayName = profile?.full_name || user.email || "Member";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Instruments, borrow requests and announcements are real data; Events'
  // dashboard card stays a placeholder (see app/dashboard/data.ts) until
  // that's wired up here too — out of scope for this module.
  let statsError = false;
  let instrumentStats: Awaited<ReturnType<typeof getInstrumentStats>> | null = null;
  let borrowStats: Awaited<ReturnType<typeof getMyBorrowStats>> | null = null;
  let announcements: Announcement[] = [];

  try {
    [instrumentStats, borrowStats, announcements] = await Promise.all([
      getInstrumentStats(),
      getMyBorrowStats(),
      getLatestDashboardAnnouncements(),
    ]);
  } catch {
    statsError = true;
  }

  const summaryStats = [
    {
      label: "Available Instruments",
      value: instrumentStats?.available ?? "—",
      icon: <InstrumentIcon className="h-5 w-5" />,
    },
    {
      label: "My Active Borrowings",
      value: borrowStats?.activeBorrowings ?? "—",
      icon: <SwapIcon className="h-5 w-5" />,
    },
    {
      label: "Pending Requests",
      value: borrowStats?.pendingRequests ?? "—",
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      label: "Upcoming Events",
      value: UPCOMING_EVENTS_COUNT,
      icon: <CalendarIcon className="h-5 w-5" />,
    },
  ];

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
                Welcome back, {displayName}
              </h1>
              <Badge variant={isAdmin ? "gold" : "default"}>
                {isAdmin ? "Admin" : "Member"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-[#666666]">{today}</p>
            <p className="mt-1 text-sm text-[#666666]">
              Here&apos;s what&apos;s happening in the club.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            {isAdmin && (
              <Button href="/admin" variant="outline">
                Open Admin Panel
              </Button>
            )}
            <LogoutButton />
          </div>
        </div>

        {statsError && (
          <p className="mt-6 text-sm text-red-600">
            Some of your stats couldn&apos;t be loaded right now.
          </p>
        )}

        {/* Summary cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((stat) => (
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
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              icon={<InstrumentIcon className="h-5 w-5" />}
              label="Browse Instruments"
              href="/instruments"
            />
            <QuickActionCard
              icon={<PlusIcon className="h-5 w-5" />}
              label="Request an Instrument"
              href="/instruments"
            />
            <QuickActionCard
              icon={<SwapIcon className="h-5 w-5" />}
              label="View My Borrowings"
              href="/my-borrowings"
            />
            <QuickActionCard
              icon={<MegaphoneIcon className="h-5 w-5" />}
              label="View Announcements"
              href="/announcements"
            />
          </div>
        </div>

        {/* Announcements + Events */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnnouncementsListCard announcements={announcements} />
          <ListCard
            title="Upcoming Events"
            icon={<CalendarIcon className="h-4 w-4" />}
            items={UPCOMING_EVENTS}
            viewAllHref="/events"
            viewAllLabel="View All Events"
          />
        </div>
      </div>
    </main>
  );
}
