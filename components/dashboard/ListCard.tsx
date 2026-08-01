import type { ReactNode } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

interface ListCardProps {
  title: string;
  icon: ReactNode;
  items: string[];
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function ListCard({
  title,
  icon,
  items,
  viewAllHref,
  viewAllLabel,
}: ListCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] text-[#C8A928]">
          {icon}
        </span>
        <h2 className="font-serif text-lg font-semibold text-[#111111]">
          {title}
        </h2>
      </div>

      <ul className="mt-5">
        {items.map((item) => (
          <li key={item}>
            <span className="block border-t border-[#E8E8E8] py-3 text-sm text-[#111111] first:border-t-0 first:pt-0">
              {item}
            </span>
          </li>
        ))}
      </ul>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
        >
          {viewAllLabel}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </Card>
  );
}
