"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/components/ui/icons";
import type { GalleryImage } from "@/types/gallery";

interface LightboxProps {
  images: GalleryImage[];
  activeIndex: number;
  albumTitle: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  images,
  activeIndex,
  albumTitle,
  onClose,
  onNavigate,
}: LightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const image = images[activeIndex];

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        onNavigate((activeIndex - 1 + images.length) % images.length);
      } else if (event.key === "ArrowRight") {
        onNavigate((activeIndex + 1) % images.length);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    // Prevent the page behind the lightbox from scrolling while it's open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, images.length, onClose, onNavigate]);

  if (!image) return null;

  const caption = image.caption ?? `${albumTitle} — photo ${activeIndex + 1} of ${images.length}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 sm:p-8"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between text-white">
        <p className="text-sm text-white/70">
          {activeIndex + 1} / {images.length}
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close lightbox"
          className="rounded-full p-2 text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate((activeIndex - 1 + images.length) % images.length)}
            aria-label="Previous image"
            className="absolute left-0 z-10 rounded-full p-2 text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white sm:left-4"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
        )}

        <div className="relative h-full w-full">
          <Image
            src={image.image_url}
            alt={image.alt_text ?? caption}
            fill
            sizes="90vw"
            className="object-contain"
            priority
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate((activeIndex + 1) % images.length)}
            aria-label="Next image"
            className="absolute right-0 z-10 rounded-full p-2 text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white sm:right-4"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        )}
      </div>

      {image.caption && (
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-white/80">
          {image.caption}
        </p>
      )}
    </div>
  );
}
