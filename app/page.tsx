import About from "@/components/About";
import Contact from "@/components/Contact";
import Events from "@/components/Events";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import Mainboard from "@/components/Mainboard";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <About />
      <Gallery />
      <Events />
      <Mainboard />
      <Contact />
    </main>
  );
}
