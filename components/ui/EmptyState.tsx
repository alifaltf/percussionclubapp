import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E8E8E8] bg-white px-6 py-16 text-center">
      {icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#E8E8E8] text-[#C8A928]">
          {icon}
        </span>
      )}
      <p className="font-serif text-lg font-semibold text-[#111111]">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[#666666]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
