import About from "@/components/About";
import Events from "@/components/Events";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <About />
      <Gallery />
      <Events />
    </main>
  );
}
