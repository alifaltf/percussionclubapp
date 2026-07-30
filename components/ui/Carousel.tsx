"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";

interface CarouselImage {
  src: string;
  alt: string;
}

interface CarouselProps {
  images: CarouselImage[];
  intervalMs?: number;
  className?: string;
  children?: ReactNode;
}

export default function Carousel({
  images,
  intervalMs = 5000,
  className = "",
  children,
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideCount = images.length;

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) return;

    const timer = setInterval(goToNext, intervalMs);
    return () => clearInterval(timer);
  }, [isPaused, goToNext, intervalMs, slideCount]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#111111] ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {images.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== activeIndex}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Overlay content slot (headline, buttons, etc.) */}
      {children && (
        <div className="relative flex h-full w-full items-center justify-center px-6">
          {children}
        </div>
      )}

      {/* Prev / Next arrows */}
      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] sm:left-6"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] sm:right-6"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Slide indicators */}
      {slideCount > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-6 bg-[#C8A928]"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
