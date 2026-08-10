import { Suspense } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import ReportSummaryCards from "@/components/admin/reports/ReportSummaryCards";
import ReportSection from "@/components/admin/reports/ReportSection";
import RankedList from "@/components/admin/reports/RankedList";
import InstrumentChipList from "@/components/admin/reports/InstrumentChipList";
import DateRangeFilter from "@/components/admin/reports/DateRangeFilter";
import ExportButtons from "@/components/admin/reports/ExportButtons";
import BorrowingsByMonthChart from "@/components/admin/reports/charts/BorrowingsByMonthChart";
import InstrumentStatusPieChart from "@/components/admin/reports/charts/InstrumentStatusPieChart";
import InstrumentConditionBarChart from "@/components/admin/reports/charts/InstrumentConditionBarChart";
import TopBorrowedInstrumentsChart from "@/components/admin/reports/charts/TopBorrowedInstrumentsChart";
import MemberActivityChart from "@/components/admin/reports/charts/MemberActivityChart";
import {
  BarChartIcon,
  CalendarIcon,
  DownloadIcon,
  GalleryIcon,
  InstrumentIcon,
  MegaphoneIcon,
  SwapIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAnnouncementStats } from "@/lib/supabase/announcements";
import {
  getBorrowingAnalytics,
  getEventAnalytics,
  getGalleryAnalytics,
  getInstrumentAnalytics,
  getMemberAnalytics,
  getReportSummary,
  resolveDateRange,
} from "@/lib/supabase/reports";
import type {
  AnnouncementAnalytics,
  BorrowingAnalytics,
  EventAnalytics,
  GalleryAnalytics,
  InstrumentAnalytics,
  MemberAnalytics,
  ReportDateRangeKey,
  ReportSummary,
} from "@/types/report";

interface AdminReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const EMPTY_SUMMARY: ReportSummary = {
  totalInstruments: 0,
  availableInstruments: 0,
  borrowedInstruments: 0,
  damagedInstruments: 0,
  activeBorrowings: 0,
  pendingBorrowRequests: 0,
  overdueBorrowings: 0,
  completedBorrowings: 0,
  upcomingEvents: 0,
  publishedAnnouncements: 0,
};

const EMPTY_BORROWING: BorrowingAnalytics = {
  byMonth: [],
  mostBorrowed: [],
  memberActivity: [],
  averageDurationDays: null,
  completedCount: 0,
  cancelledOrRejectedCount: 0,
};

const EMPTY_INSTRUMENTS: InstrumentAnalytics = {
  statusDistribution: [],
  conditionDistribution: [],
  mostBorrowedLifetime: [],
  neverBorrowed: [],
  damagedOrMaintenance: [],
  highestDamageReports: [],
};

const EMPTY_MEMBERS: MemberAnalytics = {
  total: 0,
  withBorrowingActivity: 0,
  withNoBorrowingActivity: 0,
  memberRoleCount: 0,
  adminRoleCount: 0,
  membersWithActiveBorrowings: 0,
  membersWithOverdueBorrowings: 0,
  mostActiveBorrowersLifetime: [],
};

const EMPTY_EVENTS: EventAnalytics = { upcoming: 0, completed: 0, cancelled: 0, byMonth: [] };

const EMPTY_GALLERY: GalleryAnalytics = {
  totalAlbums: 0,
  publishedAlbums: 0,
  totalImages: 0,
  featuredAlbums: 0,
};

const EMPTY_ANNOUNCEMENTS: AnnouncementAnalytics = { published: 0, draft: 0, pinned: 0, urgent: 0 };

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const rangeKey = (firstValue(params.range) ?? "90") as ReportDateRangeKey;
  const customStart = firstValue(params.start);
  const customEnd = firstValue(params.end);
  const range = resolveDateRange(rangeKey, customStart, customEnd);

  let loadError = false;
  let summary = EMPTY_SUMMARY;
  let borrowing = EMPTY_BORROWING;
  let instruments = EMPTY_INSTRUMENTS;
  let members = EMPTY_MEMBERS;
  let events = EMPTY_EVENTS;
  let gallery = EMPTY_GALLERY;
  let announcements = EMPTY_ANNOUNCEMENTS;

  try {
    [summary, borrowing, instruments, members, events, gallery, announcements] = await Promise.all([
      getReportSummary(),
      getBorrowingAnalytics(range),
      getInstrumentAnalytics(),
      getMemberAnalytics(),
      getEventAnalytics(range),
      getGalleryAnalytics(),
      getAnnouncementStats(),
    ]);
  } catch {
    loadError = true;
  }

  const exportQuery = new URLSearchParams();
  exportQuery.set("range", rangeKey);
  if (rangeKey === "custom") {
    if (customStart) exportQuery.set("start", customStart);
    if (customEnd) exportQuery.set("end", customEnd);
  }

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Admin
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            Reports &amp; Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#666666]">
            Live statistics drawn directly from club data — instruments, borrowing, members,
            events, gallery and announcements.
          </p>
        </div>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<BarChartIcon className="h-5 w-5" />}
              title="Couldn't load reports"
              description="Something went wrong while fetching report data. Please try again."
              action={
                <Button href="/admin/reports" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-8">
              <Suspense fallback={null}>
                <DateRangeFilter />
              </Suspense>
            </div>

            <div className="mt-8">
              <ReportSummaryCards summary={summary} memberAnalytics={members} />
            </div>

            <ReportSection
              title="Borrowing Analytics"
              icon={<SwapIcon className="h-4 w-4" />}
              description="Reflects the selected date range."
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">Borrowings by Month</h3>
                  <div className="mt-3">
                    <BorrowingsByMonthChart data={borrowing.byMonth} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">Top Borrowed Instruments</h3>
                  <div className="mt-3">
                    <TopBorrowedInstrumentsChart data={borrowing.mostBorrowed} />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-[#111111]">Member Borrowing Activity</h3>
                <p className="text-xs text-[#666666]">
                  Based on borrow requests only — not account or login activity.
                </p>
                <div className="mt-3">
                  <MemberActivityChart data={borrowing.memberActivity} />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <RankedList
                  title="Most Active Borrowers"
                  items={borrowing.memberActivity.slice(0, 5).map((item) => ({
                    id: item.id,
                    label: item.name,
                    value: item.count,
                  }))}
                />
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">Average Borrow Duration</h3>
                  <p className="mt-3 font-serif text-2xl font-semibold text-[#111111]">
                    {borrowing.averageDurationDays !== null
                      ? `${borrowing.averageDurationDays} days`
                      : "—"}
                  </p>
                  <p className="text-xs text-[#666666]">Completed borrowings only.</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">Completed</h3>
                  <p className="mt-3 font-serif text-2xl font-semibold text-[#111111]">
                    {borrowing.completedCount}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">Cancelled / Rejected</h3>
                  <p className="mt-3 font-serif text-2xl font-semibold text-[#111111]">
                    {borrowing.cancelledOrRejectedCount}
                  </p>
                </div>
              </div>
            </ReportSection>

            <ReportSection
              title="Instrument Analytics"
              icon={<InstrumentIcon className="h-4 w-4" />}
              description="Current state — not affected by the date range."
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">Status Distribution</h3>
                  <div className="mt-3">
                    <InstrumentStatusPieChart data={instruments.statusDistribution} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">Condition Distribution</h3>
                  <div className="mt-3">
                    <InstrumentConditionBarChart data={instruments.conditionDistribution} />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <RankedList
                  title="Most Borrowed (All Time)"
                  items={instruments.mostBorrowedLifetime.map((item) => ({
                    id: item.id,
                    label: item.name,
                    sublabel: item.instrumentCode,
                    value: item.count,
                  }))}
                />
                <RankedList
                  title="Highest Damage Report Count"
                  items={instruments.highestDamageReports.map((item) => ({
                    id: item.id,
                    label: item.name,
                    sublabel: item.instrumentCode,
                    value: item.count,
                  }))}
                  emptyMessage="No damage reports."
                />
                <InstrumentChipList
                  title="Never Borrowed"
                  items={instruments.neverBorrowed}
                  emptyMessage="Every instrument has been borrowed at least once."
                />
              </div>

              <div className="mt-8">
                <InstrumentChipList
                  title="Damaged / Under Maintenance"
                  items={instruments.damagedOrMaintenance.map((item) => ({
                    id: item.id,
                    name: item.name,
                    instrumentCode: item.instrumentCode,
                    meta: item.status,
                  }))}
                  emptyMessage="No instruments currently damaged or under maintenance."
                />
              </div>
            </ReportSection>

            <ReportSection
              title="Member Analytics"
              icon={<UsersIcon className="h-4 w-4" />}
              description="Current state — not affected by the date range."
            >
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                <StatBlock label="Total Members" value={members.total} />
                <StatBlock label="Members with Borrowing Activity" value={members.withBorrowingActivity} />
                <StatBlock
                  label="Members with No Borrowing Activity"
                  value={members.withNoBorrowingActivity}
                />
                <StatBlock label="Members" value={members.memberRoleCount} />
                <StatBlock label="Admins" value={members.adminRoleCount} />
                <StatBlock
                  label="Members with Active Borrowings"
                  value={members.membersWithActiveBorrowings}
                />
                <StatBlock
                  label="Members with Overdue Borrowings"
                  value={members.membersWithOverdueBorrowings}
                />
              </div>

              <div className="mt-8">
                <RankedList
                  title="Most Active Borrowers (All Time)"
                  items={members.mostActiveBorrowersLifetime.map((item) => ({
                    id: item.id,
                    label: item.name,
                    value: item.count,
                  }))}
                />
              </div>
            </ReportSection>

            <ReportSection
              title="Event Analytics"
              icon={<CalendarIcon className="h-4 w-4" />}
              description="Counts reflect current state; the monthly breakdown reflects the date range."
            >
              <div className="grid grid-cols-3 gap-5">
                <StatBlock label="Upcoming" value={events.upcoming} />
                <StatBlock label="Completed" value={events.completed} />
                <StatBlock label="Cancelled" value={events.cancelled} />
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-[#111111]">Events by Month</h3>
                {events.byMonth.length === 0 ? (
                  <p className="mt-3 text-sm text-[#666666]">No events in the selected range.</p>
                ) : (
                  <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {events.byMonth.map((item) => (
                      <li
                        key={item.month}
                        className="rounded-lg border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111]"
                      >
                        {item.label}: <span className="font-semibold">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ReportSection>

            <ReportSection
              title="Gallery Analytics"
              icon={<GalleryIcon className="h-4 w-4" />}
              description="Current state."
            >
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                <StatBlock label="Total Albums" value={gallery.totalAlbums} />
                <StatBlock label="Published Albums" value={gallery.publishedAlbums} />
                <StatBlock label="Featured Albums" value={gallery.featuredAlbums} />
                <StatBlock label="Total Images" value={gallery.totalImages} />
              </div>
            </ReportSection>

            <ReportSection
              title="Announcement Analytics"
              icon={<MegaphoneIcon className="h-4 w-4" />}
              description="Current state."
            >
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                <StatBlock label="Published" value={announcements.published} />
                <StatBlock label="Draft" value={announcements.draft} />
                <StatBlock label="Pinned" value={announcements.pinned} />
                <StatBlock label="Urgent" value={announcements.urgent} />
              </div>
            </ReportSection>

            <ReportSection
              title="Export Reports"
              icon={<DownloadIcon className="h-4 w-4" />}
              description="CSV exports honor the date range selected above. Admin-only."
            >
              <ExportButtons queryString={exportQuery.toString()} />
            </ReportSection>
          </>
        )}
      </div>
    </main>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-serif text-2xl font-semibold text-[#111111]">{value}</p>
      <p className="text-xs uppercase tracking-wide text-[#666666]">{label}</p>
    </div>
  );
}
