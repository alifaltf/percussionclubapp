import Image from "next/image";
import { GalleryIcon } from "@/components/ui/icons";

interface AlbumCoverImageProps {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export default function AlbumCoverImage({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
}: AlbumCoverImageProps) {
  return (
    <div className={`relative overflow-hidden bg-[#F8F8F6] ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <GalleryIcon className="h-10 w-10 text-[#C8A928]/50" />
        </div>
      )}
    </div>
  );
}
