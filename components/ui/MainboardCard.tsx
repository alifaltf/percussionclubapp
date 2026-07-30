import Image from "next/image";
import { EmailIcon, InstagramIcon } from "@/components/ui/icons";

interface SocialLinks {
  instagram: string;
  email: string;
}

interface MainboardCardProps {
  image: { src: string; alt: string };
  name: string;
  position: string;
  bio: string;
  social: SocialLinks;
}

export default function MainboardCard({
  image,
  name,
  position,
  bio,
  social,
}: MainboardCardProps) {
  return (
    <div className="group flex flex-col items-center rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#C8A928]/40 hover:shadow-sm">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#C8A928]/30">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="112px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <h3 className="mt-5 font-serif text-xl font-semibold text-[#111111]">
        {name}
      </h3>

      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[#C8A928]">
        {position}
      </p>

      <p className="mt-4 text-sm leading-relaxed text-[#666666]">{bio}</p>

      <div className="mt-6 flex items-center gap-3">
        <a
          href={social.instagram}
          aria-label={`${name} on Instagram`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] text-[#666666] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928]"
        >
          <InstagramIcon />
        </a>
        <a
          href={social.email}
          aria-label={`Email ${name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] text-[#666666] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928]"
        >
          <EmailIcon />
        </a>
      </div>
    </div>
  );
}
