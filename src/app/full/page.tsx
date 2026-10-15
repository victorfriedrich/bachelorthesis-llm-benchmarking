import type { Metadata } from "next";
import { Footer, Nav } from "@/components/shell";
import { Act } from "@/components/ui";
import { ACTS } from "@/lib/story";
import { Hero } from "@/components/hero";
import { Lessons } from "@/components/lessons";
import {
  Agreement, Direction, Evidence, Method, Problem, Profiles, Prompt, Resolution, Reruns, Structure, Verdict,
} from "@/components/sections";

/** The long version with every chapter of the thesis, kept for examiners; not indexed. */
export const metadata: Metadata = { title: "Full analysis · Victor Friedrich", robots: { index: false } };

export default function Full() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Act {...ACTS[0]} />
        <Problem />
        <Method />
        <Act {...ACTS[1]} />
        <Agreement />
        <Structure />
        <Direction />
        <Profiles />
        <Act {...ACTS[2]} />
        <Prompt />
        <Act {...ACTS[3]} />
        <Reruns />
        <Evidence />
        <Resolution />
        <Verdict />
        <Lessons />
      </main>
      <Footer />
    </>
  );
}
