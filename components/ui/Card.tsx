import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
