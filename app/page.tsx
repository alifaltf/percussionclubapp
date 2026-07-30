import About from "@/components/About";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <About />
      <Gallery />
    </main>
  );
}
