// ---------------------------------------------------------------------------
// Date range filtering
// ---------------------------------------------------------------------------

export type ReportDateRangeKey = "7" | "30" | "90" | "180" | "365" | "all" | "custom";

export const REPORT_DATE_RANGE_OPTIONS: { value: ReportDateRangeKey; label: string }[] = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "180", label: "Last 180 Days" },
  { value: "365", label: "Last 365 Days" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

export const DEFAULT_REPORT_DATE_RANGE_KEY: ReportDateRangeKey = "90";

/** Resolved, inclusive date bounds (YYYY-MM-DD). Both null means "all time". */
export interface ReportDateRange {
  start: string | null;
  end: string | null;
}

// ---------------------------------------------------------------------------
// Shared aggregate shapes
// ---------------------------------------------------------------------------

export interface MonthlyCount {
  /** "YYYY-MM" */
  month: string;
  /** e.g. "Jan 2026" */
  label: string;
  count: number;
}

export interface InstrumentCount {
  id: string;
  name: string;
  instrumentCode: string;
  count: number;
}

export interface MemberCount {
  id: string;
  name: string;
  count: number;
}

export interface DistributionItem {
  key: string;
  label: string;
  count: number;
}

export interface NeverBorrowedInstrument {
  id: string;
  name: string;
  instrumentCode: string;
  category: string;
}

export interface DamagedOrMaintenanceInstrument {
  id: string;
  name: string;
  instrumentCode: string;
  status: string;
  condition: string;
}

// ---------------------------------------------------------------------------
// Summary cards (current-state, never date-filtered)
// ---------------------------------------------------------------------------

export interface ReportSummary {
  totalInstruments: number;
  availableInstruments: number;
  borrowedInstruments: number;
  damagedInstruments: number;
  activeBorrowings: number;
  pendingBorrowRequests: number;
  overdueBorrowings: number;
  completedBorrowings: number;
  upcomingEvents: number;
  publishedAnnouncements: number;
}

// ---------------------------------------------------------------------------
// Borrowing analytics (date-filtered)
// ---------------------------------------------------------------------------

export interface BorrowingAnalytics {
  byMonth: MonthlyCount[];
  /** Top instruments by request count within the selected date range. */
  mostBorrowed: InstrumentCount[];
  /**
   * Top 10 members by request count within the selected date range. Used
   * both for the "Member Borrowing Activity" chart and, sliced to 5, for
   * the most-active-borrowers list in this section.
   */
  memberActivity: MemberCount[];
  averageDurationDays: number | null;
  completedCount: number;
  cancelledOrRejectedCount: number;
}

// ---------------------------------------------------------------------------
// Instrument analytics (lifetime / current-state — not date-filtered, since
// status/condition and "ever borrowed" are point-in-time facts about the
// instrument, not a trend over the selected window)
// ---------------------------------------------------------------------------

export interface InstrumentAnalytics {
  statusDistribution: DistributionItem[];
  conditionDistribution: DistributionItem[];
  mostBorrowedLifetime: InstrumentCount[];
  neverBorrowed: NeverBorrowedInstrument[];
  damagedOrMaintenance: DamagedOrMaintenanceInstrument[];
  highestDamageReports: InstrumentCount[];
}

// ---------------------------------------------------------------------------
// Member analytics (lifetime / current-state)
// ---------------------------------------------------------------------------

export interface MemberAnalytics {
  total: number;
  /** Real data only — derived from borrow_requests, not login/session activity. */
  withBorrowingActivity: number;
  withNoBorrowingActivity: number;
  memberRoleCount: number;
  adminRoleCount: number;
  membersWithActiveBorrowings: number;
  membersWithOverdueBorrowings: number;
  mostActiveBorrowersLifetime: MemberCount[];
}

// ---------------------------------------------------------------------------
// Event analytics
// ---------------------------------------------------------------------------

export interface EventAnalytics {
  upcoming: number;
  completed: number;
  cancelled: number;
  /** Date-filtered, keyed off event_date. */
  byMonth: MonthlyCount[];
}

// ---------------------------------------------------------------------------
// Gallery / announcement analytics (current-state)
// ---------------------------------------------------------------------------

export interface GalleryAnalytics {
  totalAlbums: number;
  publishedAlbums: number;
  totalImages: number;
  featuredAlbums: number;
}

export interface AnnouncementAnalytics {
  published: number;
  draft: number;
  pinned: number;
  urgent: number;
}
