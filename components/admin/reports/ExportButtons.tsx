import Button from "@/components/ui/Button";

interface ExportButtonsProps {
  queryString: string;
}

const EXPORTS = [
  { href: "/admin/reports/export/borrowings", label: "Export Borrowing Report (CSV)" },
  { href: "/admin/reports/export/instruments", label: "Export Instrument Report (CSV)" },
  { href: "/admin/reports/export/members", label: "Export Member Report (CSV)" },
];

/** Plain download links — the route handlers stream CSV with a Content-Disposition header. */
export default function ExportButtons({ queryString }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {EXPORTS.map((item) => (
        <Button key={item.href} href={`${item.href}?${queryString}`} variant="outline">
          {item.label}
        </Button>
      ))}
    </div>
  );
}
