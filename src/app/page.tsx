import { Footer, Nav } from "@/components/shell";
import { Hero } from "@/components/hero";
import { Lessons } from "@/components/lessons";
import { SHORT_CHAPTERS, SHORT_LINKS } from "@/lib/story";
import { ShortCost, ShortLimits, ShortPrecision, ShortSeparation } from "@/components/short";

/** The site: hero, three result chapters, cost, lessons. */
export default function Home() {
  return (
    <>
      <Nav chapters={SHORT_CHAPTERS} />
      <main>
        <Hero links={SHORT_LINKS} />
        <ShortSeparation />
        <ShortLimits />
        <ShortPrecision />
        <ShortCost />
        <Lessons n="05" />
      </main>
      <Footer />
    </>
  );
}
