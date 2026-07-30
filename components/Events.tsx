import Button from "@/components/ui/Button";
import EventCard from "@/components/ui/EventCard";
import Reveal from "@/components/ui/Reveal";

const EVENTS = [
  {
    image: {
      src: "/images/events/event-1.jpg",
      alt: "Rhythm Night 2026 performance",
    },
    title: "Rhythm Night 2026",
    date: "20 September 2026",
    time: "8:00 PM",
    location: "IIUM Cultural Centre",
    description:
      "An evening of percussion performances featuring members of the IIUM Percussion Club.",
    href: "/events",
  },
  {
    image: {
      src: "/images/events/event-2.jpg",
      alt: "Beginner Percussion Workshop session",
    },
    title: "Beginner Percussion Workshop",
    date: "5 October 2026",
    time: "2:00 PM",
    location: "Student Activity Centre",
    description:
      "A beginner-friendly session introducing basic percussion techniques and instruments.",
    href: "/events",
  },
  {
    image: {
      src: "/images/events/event-3.jpg",
      alt: "Club Open Day gathering",
    },
    title: "Club Open Day",
    date: "18 October 2026",
    time: "10:00 AM",
    location: "IIUM Main Campus",
    description:
      "Meet the members, try the instruments and learn more about joining the club.",
    href: "/events",
  },
];

export default function Events() {
  return (
    <section id="events" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Upcoming Events
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
            Feel the Next Beat
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#666666] sm:text-lg">
            Stay connected with our upcoming performances, workshops and club
            activities.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((event, index) => (
            <Reveal key={event.title} delayMs={index * 100}>
              <EventCard {...event} />
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={300} className="mt-14 flex justify-center">
          <Button href="/events" variant="outline">
            View All Events
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
