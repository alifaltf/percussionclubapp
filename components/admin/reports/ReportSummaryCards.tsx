import SummaryCard from "@/components/dashboard/SummaryCard";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  InstrumentIcon,
  MegaphoneIcon,
  SwapIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { MemberAnalytics, ReportSummary } from "@/types/report";

interface ReportSummaryCardsProps {
  summary: ReportSummary;
  memberAnalytics: MemberAnalytics;
}

export default function ReportSummaryCards({ summary, memberAnalytics }: ReportSummaryCardsProps) {
  const cards = [
    { label: "Total Members", value: memberAnalytics.total, icon: <UsersIcon className="h-5 w-5" /> },
    {
      // Replaces a literal "Active Members" card — this club has no login
      // activity data, so this is explicitly scoped to borrowing history.
      label: "Members with Borrowing Activity",
      value: memberAnalytics.withBorrowingActivity,
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      label: "Total Instruments",
      value: summary.totalInstruments,
      icon: <InstrumentIcon className="h-5 w-5" />,
    },
    {
      label: "Available Instruments",
      value: summary.availableInstruments,
      icon: <CheckCircleIcon className="h-5 w-5" />,
    },
    {
      label: "Borrowed Instruments",
      value: summary.borrowedInstruments,
      icon: <SwapIcon className="h-5 w-5" />,
    },
    {
      label: "Damaged Instruments",
      value: summary.damagedInstruments,
      icon: <AlertTriangleIcon className="h-5 w-5" />,
    },
    {
      label: "Active Borrowings",
      value: summary.activeBorrowings,
      icon: <SwapIcon className="h-5 w-5" />,
    },
    {
      label: "Pending Borrow Requests",
      value: summary.pendingBorrowRequests,
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      label: "Overdue Borrowings",
      value: summary.overdueBorrowings,
      icon: <AlertTriangleIcon className="h-5 w-5" />,
    },
    {
      label: "Completed Borrowings",
      value: summary.completedBorrowings,
      icon: <CheckCircleIcon className="h-5 w-5" />,
    },
    {
      label: "Upcoming Events",
      value: summary.upcomingEvents,
      icon: <CalendarIcon className="h-5 w-5" />,
    },
    {
      label: "Published Announcements",
      value: summary.publishedAnnouncements,
      icon: <MegaphoneIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.label} icon={card.icon} label={card.label} value={card.value} />
      ))}
    </div>
  );
}
