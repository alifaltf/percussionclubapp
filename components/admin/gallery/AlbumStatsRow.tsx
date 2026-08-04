import SummaryCard from "@/components/dashboard/SummaryCard";
import { CameraIcon, CheckCircleIcon, ClockIcon, GalleryIcon } from "@/components/ui/icons";
import type { GalleryStats } from "@/types/gallery";

interface AlbumStatsRowProps {
  stats: GalleryStats;
}

export default function AlbumStatsRow({ stats }: AlbumStatsRowProps) {
  const items = [
    { label: "Total Albums", value: stats.totalAlbums, icon: <GalleryIcon className="h-5 w-5" /> },
    { label: "Published", value: stats.published, icon: <CheckCircleIcon className="h-5 w-5" /> },
    { label: "Draft", value: stats.draft, icon: <ClockIcon className="h-5 w-5" /> },
    { label: "Total Images", value: stats.totalImages, icon: <CameraIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
      {items.map((item) => (
        <SummaryCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
