import MainboardCard from "@/components/ui/MainboardCard";
import Reveal from "@/components/ui/Reveal";

const PLACEHOLDER_SOCIAL = {
  instagram: "#",
  email: "#",
};

const MAINBOARD_MEMBERS = [
  {
    image: { src: "/images/mainboard/member-1.jpg", alt: "President portrait" },
    name: "Full Name",
    position: "President",
    bio: "Leads the club's vision, oversees all activities, and represents IIUM Percussion Club at university and community events.",
    social: PLACEHOLDER_SOCIAL,
  },
  {
    image: { src: "/images/mainboard/member-2.jpg", alt: "Vice President portrait" },
    name: "Full Name",
    position: "Vice President",
    bio: "Supports the President in daily operations and steps in to coordinate the club whenever needed.",
    social: PLACEHOLDER_SOCIAL,
  },
  {
    image: { src: "/images/mainboard/member-3.jpg", alt: "Secretary portrait" },
    name: "Full Name",
    position: "Secretary",
    bio: "Manages club communications and documentation, keeping every member informed and organised.",
    social: PLACEHOLDER_SOCIAL,
  },
  {
    image: { src: "/images/mainboard/member-4.jpg", alt: "Treasurer portrait" },
    name: "Full Name",
    position: "Treasurer",
    bio: "Oversees the club's finances and budgeting, ensuring resources are used responsibly.",
    social: PLACEHOLDER_SOCIAL,
  },
  {
    image: { src: "/images/mainboard/member-5.jpg", alt: "Equipment Manager portrait" },
    name: "Full Name",
    position: "Equipment Manager",
    bio: "Maintains and manages all percussion instruments, ensuring they are performance-ready at all times.",
    social: PLACEHOLDER_SOCIAL,
  },
  {
    image: { src: "/images/mainboard/member-6.jpg", alt: "Music Director portrait" },
    name: "Full Name",
    position: "Music Director",
    bio: "Leads musical direction, rehearsals and performance arrangements for the club.",
    social: PLACEHOLDER_SOCIAL,
  },
];

export default function Mainboard() {
  return (
    <section id="mainboard" className="bg-[#F8F8F6] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Our Mainboard
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
            Meet the Mainboard
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#666666] sm:text-lg">
            Behind every performance is a dedicated team of student leaders
            committed to guiding the IIUM Percussion Club. Meet the mainboard
            members who lead, organize and inspire our community.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {MAINBOARD_MEMBERS.map((member, index) => (
            <Reveal key={member.position} delayMs={(index % 3) * 100}>
              <MainboardCard {...member} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
