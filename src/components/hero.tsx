"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { data, num } from "@/lib/data";
import { ASPECT_LABEL, COLOR, EASE } from "@/lib/tokens";
import { Segmented } from "./ui";
import { HaloStepper } from "./halo-stepper";
import { THESIS_PDF } from "@/lib/story";

type Mode = "guests" | "claude" | "deepseek" | "jev";
const MODE_COLOR: Record<Mode, string> = { guests: COLOR.Human, claude: COLOR.Claude, deepseek: COLOR.DeepSeek, jev: COLOR.Jev };
const MODE_LABEL: Record<Mode, string> = { guests: "Guests' ratings", claude: "Claude", deepseek: "DeepSeek", jev: "Jev" };

/** Least-squares map from a model's overall score onto the guests' overall score (Section 4.1, calibrated). */
function calibration(key: "p" | "d" | "j") {
  const pts = data.ch4.scatter.filter((s) => s[key] != null).map((s) => [s[key] as number, s.h]);
  const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  let sxy = 0, sxx = 0;
  for (const [x, y] of pts) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; }
  const b = sxy / sxx;
  return (x: number) => Math.max(0, Math.min(1, my - b * mx + b * x));
}

const MODE_INTRO: Record<Exclude<Mode, "guests">, string> = {
  claude: "Claude scored the same hostels from the written reviews.",
  deepseek: "DeepSeek, a cheaper open model, scored the same reviews.",
  jev: "Jev, a model that gives probabilities instead of text, scored the same reviews.",
};

const toDisplay = (x: number) => 2 + 8 * x; // Hostelworld shows ratings on 2–10

export function Hero({ links }: { links?: { href: string; label: string }[] }) {
  const schemaPct = Math.round(num(data.ch4.ablation.find((r) => r.City === "Mean")!, "Schema-awareness share") * 100);
  return (
    <section id="top" className="mx-auto w-full max-w-[1160px] px-4 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE }}>
        <div className="eyebrow mb-6">Victor Friedrich · Bachelor&apos;s thesis in Informatics · TU Munich</div>
        <h1 className="display max-w-[1000px] text-[40px] sm:text-[68px]">
          Testing an LLM judge when the human labels are biased.
        </h1>
        <div className="mt-8 grid max-w-[700px] gap-4 text-[17px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          <p>
            Hostelworld asks guests to rate seven aspects of a stay, from cleanliness to location. But most reviewers just
            rate their overall impression: roughly 40% give every aspect the same score.
          </p>
          <p>
            Written reviews say more, so an LLM reading them might score each aspect more accurately. This thesis tests that
            across {data.meta.properties} hostels and three models, without treating the guests&apos; scores as the right answer.
            The LLM scores the aspects much more independently than the guests do, in the same pattern as guests who don&apos;t
            give every aspect the same score. <span style={{ color: "var(--ink)" }}>But how the model is asked matters</span>: scoring
            each aspect in its own call makes the scores more independent, yet merely mentioning all seven aspects in the answer
            template cancelled {schemaPct}% of that improvement.
          </p>
        </div>
        <div className="mt-7 flex flex-wrap gap-3 text-[13px]">
          <a href="#lessons" className="rounded-full px-4 py-2" style={{ background: "var(--ink)", color: "var(--plane)", border: "1px solid var(--ink)" }}>Six lessons for LLM system design →</a>
          <a href={THESIS_PDF} target="_blank" rel="noopener" className="rounded-full px-4 py-2" style={{ border: "1px solid var(--hair)", color: "var(--ink)" }}>Read the thesis ↗</a>
        </div>
      </motion.div>

      <motion.div className="mt-14 sm:mt-16" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}>
        <HaloStepper />
      </motion.div>

      <Findings links={links} />
    </section>
  );
}

/** Two typical hostels, scored by guests and by each model: the per-hostel view of the halo. */
export function HostelCompare() {
  const [mode, setMode] = useState<Mode>("guests");
  const cal = useMemo(() => ({ claude: calibration("p"), deepseek: calibration("d"), jev: calibration("j") }), []);

  const aspects = data.meta.aspects;
  const hostels = data.hero.hostels;
  const med = data.hero.median;
  const values = (h: (typeof hostels)[number], m: Mode) =>
    h.human.map((v, i) => toDisplay(m === "guests" ? v : cal[m](h[m][i])));
  const spread = (m: Mode) => {
    const r = hostels.map((h) => { const v = values(h, m); return Math.max(...v) - Math.min(...v); });
    return r.reduce((a, b) => a + b, 0) / r.length;
  };

  return (
    <div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-[500px] text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            {mode === "guests"
              ? `Two typical ${hostels[0].city} hostels. On Hostelworld, each hostel's seven aspect scores sit within about ${spread("guests").toFixed(1)} points of each other. Switch the source to see what a model reads from the same reviews.`
              : `${MODE_INTRO[mode]} The seven scores now spread over ${spread(mode).toFixed(1)} points per hostel, ${(spread(mode) / spread("guests")).toFixed(1)} times as much as the guests' scores, so each hostel's weakest aspect stands out.`}
          </p>
          <Segmented label="source of the scores" value={mode}
            onChange={setMode}
            options={(["guests", "claude", "deepseek", "jev"] as Mode[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {hostels.map((h, hi) => {
            const vals = values(h, mode);
            const overall = vals.reduce((a, b) => a + b, 0) / vals.length;
            return (
              <div key={h.label} className="card p-6 sm:p-7">
                <div className="mb-6 flex items-baseline justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-medium">{h.label}</div>
                    <div className="text-[12px]" style={{ color: "var(--muted)" }}>{h.city} · {h.reviews} reviews</div>
                  </div>
                  <div className="display num text-[44px]">{overall.toFixed(1)}</div>
                </div>
                <div className="grid gap-[11px]">
                  {aspects.map((a, i) => (
                    <div key={a} className="grid grid-cols-[96px_1fr_34px] items-center gap-3 text-[13px]">
                      <span style={{ color: "var(--ink-2)" }}>{ASPECT_LABEL[a]}</span>
                      <div className="h-[6px] rounded-full" style={{ background: "var(--hair)" }}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${((vals[i] - 2) / 8) * 100}%`, backgroundColor: MODE_COLOR[mode] }}
                          transition={{ duration: 1.1, ease: EASE, delay: 0.04 * i + 0.1 * hi }} />
                      </div>
                      <span className="num text-right font-medium">{vals[i].toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 max-w-[760px] text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Both hostels are typical of the {data.hero.n} studied: close to the median in average guest score ({toDisplay(med.hmean).toFixed(1)})
          and in how far apart their aspect scores lie (median over all hostels: {(med.hrange * 8).toFixed(1)} points). All three models pick the same weakest aspect for each hostel.
          Model scores are converted to Hostelworld&apos;s 2–10 scale with a straight-line fit to the guests&apos; scores.
        </p>
      </div>
  );
}

/* ── The answer up front: three claims, each linking to the chapter that shows it ── */

const avg = (k: string) => {
  const v = data.ch4.aiicByCity.map((r) => num(r, k)).filter(Number.isFinite);
  return v.reduce((a, b) => a + b, 0) / v.length;
};

function Findings({ links }: { links?: { href: string; label: string }[] }) {
  const split = data.ch4.ablation.find((r) => r.City === "Mean")!;
  const schema = Math.round(num(split, "Schema-awareness share") * 100);
  const items = [
    {
      href: "#structure", label: "Chapters 03–06",
      claim: "LLMs tell the aspects apart better than guests do.",
      body: `Guests' seven scores mostly rise and fall together (correlation ${avg("Human").toFixed(2)}). Claude's scores from the same reviews correlate at ${avg("Predict").toFixed(2)}, and the decorrelation follows the pattern of how more differentiating reviewers rate.`,
    },
    {
      href: "#prompt", label: "Chapter 07 · new finding", accent: true,
      claim: "The output schema biases the scores.",
      body: `Even with one call per aspect, a schema that names all seven aspects keeps ${schema}% of the overlap between them.`,
    },
    {
      href: "#evidence", label: "Chapters 08–10",
      claim: "LLM scores need many reviews and are less precise than they look.",
      body: "With only a few reviews, the guests' average is more stable. Claude and DeepSeek favour certain last digits, so differences of a few hundredths mean nothing.",
    },
  ];
  if (links) items.forEach((it, i) => Object.assign(it, links[i]));
  return (
    <motion.div className="mt-16 sm:mt-20" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: EASE, delay: 0.5 }}>
      <div className="eyebrow mb-5">What the thesis finds</div>
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((it, i) => (
          <a key={it.href} href={it.href} className="group grid content-start gap-3 border-t pt-5 transition-colors"
            style={{ borderColor: it.accent ? "var(--claude)" : "var(--ink)", borderTopWidth: 2 }}>
            <div className="flex items-baseline gap-3">
              <span className="num text-[12px]" style={{ color: "var(--muted)" }}>{i + 1}</span>
              <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: it.accent ? "var(--claude)" : "var(--muted)" }}>{it.label}</span>
            </div>
            <div className="text-[21px] font-light leading-snug">{it.claim}</div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{it.body} <span className="inline-block transition-transform group-hover:translate-x-1" style={{ color: "var(--muted)" }}>→</span></p>
          </a>
        ))}
      </div>
    </motion.div>
  );
}
