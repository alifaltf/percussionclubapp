import type { ReactNode } from "react";

type BadgeVariant = "default" | "gold";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: "border-[#E8E8E8] text-[#666666]",
  gold: "border-[#C8A928] text-[#C8A928]",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
