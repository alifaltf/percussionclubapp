import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-[#E8E8E8] bg-white ${className}`}
    >
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b border-[#E8E8E8] bg-[#F8F8F6]">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[#E8E8E8]">{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tr className={className}>{children}</tr>;
}

export function TableHeadCell({
  children,
  className = "",
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#666666] ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 align-middle text-[#111111] ${className}`} {...rest}>
      {children}
    </td>
  );
}
