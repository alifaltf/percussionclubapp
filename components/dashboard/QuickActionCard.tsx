import type { ReactNode } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

interface QuickActionCardProps {
  icon: ReactNode;
  label: string;
  href: string;
}

export default function QuickActionCard({
  icon,
  label,
  href,
}: QuickActionCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="flex flex-col items-center gap-3 py-6 text-center transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#C8A928]/40">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E8E8E8] text-[#C8A928] transition-colors duration-300 group-hover:border-[#C8A928]">
          {icon}
        </span>
        <span className="text-sm font-medium text-[#111111] transition-colors duration-300 group-hover:text-[#C8A928]">
          {label}
        </span>
      </Card>
    </Link>
  );
}
