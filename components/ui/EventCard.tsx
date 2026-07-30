import Image from "next/image";
import Link from "next/link";

interface EventCardProps {
  image: { src: string; alt: string };
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  href: string;
}

export default function EventCard({
  image,
  title,
  date,
  time,
  location,
  description,
  href,
}: EventCardProps) {
  return (
    <div className="group flex h-full flex-col overflow-hidden border border-[#E8E8E8] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-sm">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F8F8F6]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#C8A928]">
          {date}
        </p>

        <h3 className="mt-2 font-serif text-xl font-semibold text-[#111111]">
          {title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#666666]">
          <span>{time}</span>
          <span aria-hidden="true" className="text-[#E8E8E8]">
            •
          </span>
          <span>{location}</span>
        </div>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-[#666666]">
          {description}
        </p>

        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
        >
          View Details
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
