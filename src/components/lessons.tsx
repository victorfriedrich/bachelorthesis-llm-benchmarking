"use client";

import type { ReactNode } from "react";
import { data, num } from "@/lib/data";
import { Chapter, Reveal } from "./ui";

/* ─── 12 · What transfers to LLM systems and agents ────────────────────────── */

const pct = (x: number) => `${Math.round(x)}%`;

function useLessons() {
  const split = data.ch4.ablation.find((r) => r.City === "Mean")!;
  const sch = num(split, "Schema-awareness share") * 100;
  const co = num(split, "Co-generation share") * 100;
  const cacheSaving = data.ch5.cache.find((c) => c.label === "Claude Predict")!.pct;
  return [
    {
      rule: "Tool schemas create subtle biases.",
      text: `Claude scored one aspect per call, but the tool it answered through listed all seven. That list alone kept ${pct(sch)} of the overlap that separate calls should have removed. The model reads a tool definition as context, not just as a format. Expose only the fields a step needs, and review a schema change like a prompt change.`,
    },
    {
      rule: "Isolate judgments that must stay independent.",
      text: `Scoring all aspects in one answer caused the other ${pct(co)}. LLMs are autoregressive, so every score leaned on the ones already written.`,
    },
    {
      rule: "A score with two decimals doesn’t carry two decimals of information.",
      text: "Claude ended four in five of its scores in 2, 5 or 8; DeepSeek preferred 0 and 5. Ties are therefore more frequent than the underlying data would suggest, which makes choosing reasonable tiebreakers important.",
    },
    {
      rule: "Clean runs don’t prove a failure mode is absent.",
      text: "DeepSeek occasionally returned 0.0 for all seven aspects: valid JSON that passed every schema check and would have entered the results as normal scores. Aside from regular benchmarking, check generated scores for rare, implausible values to catch long-tail errors.",
    },
    {
      rule: "Design the prompt around the cache.",
      text: `Prompt caches only reuse an identical prefix. Put everything that stays the same across calls first, the tool schema included, and the part that changes last, even if that puts the instruction after the content. For Claude, this made separate per-aspect calls ${pct(cacheSaving)} cheaper.`,
    },
    {
      rule: "Benchmark with the assumption that the LLM might be more accurate than the human-annotated reference dataset.",
      text: "40% of guests gave every aspect the same score, so a model that matched their ratings perfectly would have copied that halo. When the reference labels may be worse than the model, agreement stops being the goal. Test for what a good score must do instead: separate what should differ, agree with the most careful annotators, and stay stable across reruns and smaller samples.",
    },
  ];
}

export function Lessons({ n = "12", children }: { n?: string; children?: ReactNode }) {
  const lessons = useLessons();
  return (
    <Chapter id="lessons" n={n} eyebrow="For people building with LLMs" title={<>Six lessons that transfer<br />to agent design.</>}
      lede="The setting is hostel reviews, but the same design questions come up in any LLM pipeline or agent.">
      <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
        {lessons.map((l, i) => (
          <Reveal key={l.rule} delay={0.05 * (i % 2)} className="grid content-start gap-3 border-t border-[var(--hair)] pt-6">
            <h3 className="text-[21px] font-light leading-snug">{l.rule}</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{l.text}</p>
          </Reveal>
        ))}
      </div>
      {children}
    </Chapter>
  );
}
