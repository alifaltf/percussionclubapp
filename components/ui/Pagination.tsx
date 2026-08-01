"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(target));
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center rounded-sm border border-[#E8E8E8] px-4 py-2 text-sm font-medium text-[#111111] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-[#666666]">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center rounded-sm border border-[#E8E8E8] px-4 py-2 text-sm font-medium text-[#111111] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
