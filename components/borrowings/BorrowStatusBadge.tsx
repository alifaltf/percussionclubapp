import Badge from "@/components/ui/Badge";
import { BORROW_REQUEST_STATUS_LABELS, type BorrowRequestStatus } from "@/types/borrow-request";

const VARIANT_BY_STATUS: Record<
  BorrowRequestStatus,
  "default" | "gold" | "warning" | "danger"
> = {
  pending: "warning",
  approved: "gold",
  active: "gold",
  return_submitted: "warning",
  completed: "default",
  rejected: "danger",
  cancelled: "default",
  overdue: "danger",
};

interface BorrowStatusBadgeProps {
  status: BorrowRequestStatus;
  className?: string;
}

export default function BorrowStatusBadge({ status, className = "" }: BorrowStatusBadgeProps) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status]} className={className}>
      {BORROW_REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}
