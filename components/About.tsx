import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

const ABOUT_TEXT =
  "IIUM Percussion Club brings students together through rhythm, creativity and performance. We create a space where members can grow musically, build confidence and form meaningful connections through percussion.";

const STATS = [
  { value: "50+", label: "Members" },
  { value: "20+", label: "Performances" },
  { value: "10+", label: "Years of Rhythm" },
];

export default function About() {
  return (
    <section id="about" className="bg-white py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        {/* Left column */}
        <div>
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
              About the Club
            </span>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
              More Than Rhythm
            </h2>
          </Reveal>

          <Reveal delayMs={200}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#666666] sm:text-lg">
              {ABOUT_TEXT}
            </p>
          </Reveal>

          <Reveal delayMs={300}>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-[#E8E8E8] pt-8">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-serif text-2xl font-semibold text-[#111111] sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#666666] sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delayMs={400}>
            <div className="mt-10">
              <Button href="/about" variant="outline">
                Discover Our Story
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Right column — club image */}
        <Reveal
          delayMs={150}
          className="mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-[#E8E8E8] bg-[#F8F8F6]">
            <Image
              src="/images/about/about-club.jpg"
              alt="IIUM Percussion Club members together"
              fill
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw"
              className="object-cover"
            />
            <span className="absolute left-5 top-5 h-6 w-6 border-l border-t border-[#C8A928]" />
            <span className="absolute bottom-5 right-5 h-6 w-6 border-b border-r border-[#C8A928]" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
