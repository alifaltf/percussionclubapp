import Image from "next/image";

interface GalleryTileProps {
  src: string;
  alt: string;
  caption: string;
  className?: string;
  priority?: boolean;
}

export default function GalleryTile({
  src,
  alt,
  caption,
  className = "",
  priority = false,
}: GalleryTileProps) {
  return (
    <div
      className={`group relative overflow-hidden border border-[#E8E8E8] bg-[#F8F8F6] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Hover scrim for caption legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Caption overlay */}
      <span className="absolute bottom-4 left-4 translate-y-2 text-sm font-medium tracking-wide text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {caption}
      </span>
    </div>
  );
}
