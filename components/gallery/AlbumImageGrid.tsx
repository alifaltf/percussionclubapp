"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "@/components/gallery/Lightbox";
import type { GalleryImage } from "@/types/gallery";

interface AlbumImageGridProps {
  images: GalleryImage[];
  albumTitle: string;
}

export default function AlbumImageGrid({ images, albumTitle }: AlbumImageGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Open photo ${index + 1} of ${images.length}${image.caption ? `: ${image.caption}` : ""}`}
            className="group relative aspect-square overflow-hidden border border-[#E8E8E8] bg-[#F8F8F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A928]"
          >
            <Image
              src={image.image_url}
              alt={image.alt_text ?? `${albumTitle} — photo ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <Lightbox
          images={images}
          activeIndex={activeIndex}
          albumTitle={albumTitle}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </>
  );
}
