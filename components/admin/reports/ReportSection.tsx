import type { ReactNode } from "react";
import Card from "@/components/ui/Card";

interface ReportSectionProps {
  title: string;
  icon: ReactNode;
  description?: string;
  children: ReactNode;
}

/** Consistent section shell (heading + card) reused across every report section. */
export default function ReportSection({ title, icon, description, children }: ReportSectionProps) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] text-[#C8A928]">
          {icon}
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#111111]">{title}</h2>
          {description && <p className="text-xs text-[#666666]">{description}</p>}
        </div>
      </div>
      <Card className="mt-5">{children}</Card>
    </section>
  );
}
