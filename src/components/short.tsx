"use client";

import { useState } from "react";
import { data, num } from "@/lib/data";
import { COLOR } from "@/lib/tokens";
import { Chapter, Checkbox, Figure, Legend, Reveal, Segmented } from "./ui";
import { DigitStrips, GroupedBars, HBars, Lines, Scatter, Series } from "./charts";
import { NoiseExplainer } from "./explainers";

/* The site: three result chapters, then the lessons. */

const CLAUDE: Series = { key: "Predict", label: "Claude", color: COLOR.Claude };
const DEEPSEEK: Series = { key: "DeepSeek", label: "DeepSeek", color: COLOR.DeepSeek };
const JEV: Series = { key: "Jev", label: "Jev", color: COLOR.Jev };
const HUMAN: Series = { key: "Human", label: "All guests", color: COLOR.Human };
const NOFLAT: Series = { key: "No-Flat", label: "Guests whose scores vary", color: COLOR["No-Flat"] };
const MODELS3 = [CLAUDE, DEEPSEEK, JEV];

/* ─── 01 · Models tell the aspects apart ───────────────────────────────────── */

export function ShortSeparation() {
  const [model, setModel] = useState<"Claude" | "DeepSeek" | "Jev">("Claude");
  const [calibrated, setCalibrated] = useState(false);
  const key = model === "Claude" ? "p" : model === "Jev" ? "j" : "d";
  const pts = data.ch4.scatter.filter((p) => p[key] != null).map((p) => ({ x: p[key] as number, y: p.h, label: p.city }));
  const sel = data.ch4.selective;
  const groups = ["Physical", "Subjective", "Location"];
  const series: Series[] = [HUMAN, NOFLAT, ...MODELS3];
  const values = Object.fromEntries(groups.map((g) => [g, Object.fromEntries(series.map((s) => {
    const r = sel.find((x) => x.Source === s.key);
    return [s.key, r ? num(r, g) : null];
  }))]));
  return (
    <Chapter id="agreement" n="01" eyebrow="Result 1" title={<>Models tell the aspects apart,<br />and not at random.</>}
      lede="All three models rank hostels almost exactly like guests do, but their seven aspect scores are far less alike. Where they come apart matches the guests who did not give every aspect the same score.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <Figure title="Same ranking as guests"
          note={<>
            {`Overall score per hostel, ${pts.length} hostels. The models score lower than guests and on a narrower range, but in the same order. Calibration maps them onto the guests' scale with a straight-line fit made on these same hostels, so its low error is optimistic.`}
            <span className="mt-3 block"><Checkbox label="Linear calibration" checked={calibrated} onChange={setCalibrated} /></span>
          </>}
          controls={<Segmented label="model" options={["Claude", "DeepSeek", "Jev"] as const} value={model} onChange={setModel} />}>
          <Scatter points={pts} color={model === "Jev" ? COLOR.Jev : model === "DeepSeek" ? COLOR.DeepSeek : COLOR.Claude} calibrated={calibrated} xLabel={`${model} score${calibrated ? ", calibrated" : ""}`} yLabel="Guests' score" />
        </Figure>
        <Figure title="Models loosen the same links as guests whose scores vary"
          note="How strongly aspects move together (average correlation), for three kinds of pairs. Cleanliness, facilities and security stay linked: a run-down building hurts all three. Staff, atmosphere and value loosen. Location comes free entirely, since the address says nothing about the rest. Guests whose scores vary show the same order, only weaker."
          legend={<Legend items={series.map((s) => ({ label: s.label, color: s.color, mark: "rect" as const }))} />}>
          <GroupedBars groups={groups} series={series} values={values} domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} />
        </Figure>
      </div>
    </Chapter>
  );
}

/* ─── 02 · Limits ──────────────────────────────────────────────────────────── */

export function ShortLimits() {
  const sd = data.ch5.sd;
  const get = (m: string) => sd.find((r) => r.Model === m)!;
  const x = (m: string) => Math.round(num(get(m), "Hotel/Noise"));
  const models = [
    { key: "Claude", label: "Claude", color: COLOR.Claude },
    { key: "DeepSeek", label: "DeepSeek", color: COLOR.DeepSeek },
    { key: "Jev", label: "Jev", color: COLOR.Jev },
  ];
  const h = data.ch6.headline;
  const xs = h.map((r) => num(r, "chars"));
  const xl = ["1.25k", "2k", "5k", "10k"];
  const ser = (col: string) => h.map((r) => (Number.isFinite(num(r, col)) ? num(r, col) : null));
  const series = [
    { key: "num", label: "Guests' average", color: COLOR.Numeric, values: ser("mean_r_numeric") },
    { key: "claude", label: "Claude", color: COLOR.Claude, values: ser("mean_r_llm") },
    { key: "jev", label: "Jev", color: COLOR.Jev, values: ser("mean_r_jev") },
  ];
  return (
    <Chapter id="reruns" n="02" eyebrow="Limits" title={<>LLM scores are stable between runs,<br />but need many reviews.</>}
      lede="Two separate tests of how far a single score can be trusted.">
      <Reveal className="grid gap-2 pt-2">
        <div className="eyebrow">Test 1 · Same input, three runs</div>
        <p className="caption">{`Each hostel was scored three times with identical settings. A score is only useful if a rerun lands close to it, measured against how far hostels differ from each other. All three models pass: the spread between hostels is ${x("Claude")} times the run-to-run variation for Claude, ${x("Jev")} times for Jev and ${x("DeepSeek")} times for DeepSeek. That is enough to rank hostels. But DeepSeek's reruns vary as much as its prompt versions do, so subtle variations from prompt design cannot be measured.`}</p>
      </Reveal>
      <Figure title="Three runs per hostel" note="Each group of three dots is one hostel scored three times.">
        <NoiseExplainer models={models.map((m) => ({ ...m, noise: num(get(m.key), "Noise SD"), hotel: num(get(m.key), "Hotel SD"), ratio: num(get(m.key), "Hotel/Noise") }))} />
      </Figure>
      <Reveal className="mt-8 grid gap-2">
        <div className="eyebrow">Test 2 · Less text</div>
        <p className="caption">Each hostel was scored again from random samples of its reviews, from about 5 to 43 reviews. At every size, the guests&apos; own average gets closer to its full-sample value than the models do.</p>
      </Reveal>
      <Figure title="Agreement with the score from all reviews" note="Correlation between scores from a sample of reviews and from all reviews, by characters of review text. 1 = same ranking of hostels."
        legend={<Legend items={series.map((s) => ({ label: s.label, color: s.color, mark: "line" as const }))} />}>
        <Lines xs={xs} xLabels={xl} series={series} domain={[0.5, 1]} ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]} />
      </Figure>
    </Chapter>
  );
}

/* ─── 03 · Precision ───────────────────────────────────────────────────────── */

const DIGIT_SHOWN = ["DeepSeek-Predict", "Claude-Predict", "Human-Rating Mean", "Jev"];

function digitRows(sources: string[]) {
  const nice = (s: string) => s.replace("Human-Rating Mean", "Guests' average").replace("-Predict", "");
  return sources.map((s) => data.ch7.digits.find((r) => r.source === s)).filter(Boolean).map((r) => ({
    label: nice(String(r!.source)), group: String(r!.model), color: String(r!.model) === "Human" ? COLOR.Human : COLOR[String(r!.model) as "Claude"],
    p: Array.from({ length: 10 }, (_, d) => num(r!, `digit_${d}`)), h: num(r!, "H_last"),
  }));
}

export function ShortPrecision() {
  const pct = (src: string, digits: number[]) => {
    const r = data.ch7.digits.find((x) => x.source === src)!;
    return Math.round(digits.reduce((a, d) => a + num(r, `digit_${d}`), 0) * 100);
  };
  return (
    <Chapter id="resolution" n="03" eyebrow="Precision" title={<>{pct("DeepSeek-Predict", [5])}% of DeepSeek&apos;s scores<br />end in a 5.</>}
      lede={`A score of 0.85 looks precise to the hundredth. Add the scores ending in 0 and it is ${pct("DeepSeek-Predict", [0, 5])}%: in practice DeepSeek scores in steps of 0.05. Claude is not much better, with ${pct("Claude-Predict", [2, 5, 8])}% of its scores ending in 2, 5 or 8. So differences of a few hundredths carry no information.`}>
      <Figure title="How often each last digit appears" note="Share of scores ending in each digit (the second decimal). Digits used: how many of the ten the scores effectively spread over; 10 means all equally.">
        <DigitStrips rows={digitRows(DIGIT_SHOWN)} />
      </Figure>
      <Reveal className="mt-4 grid gap-2">
        <div className="eyebrow">What to do instead</div>
        <p className="caption">For finer scores, use a model that returns a probability per rating level and average the levels by probability, as Jev does over ten levels. Note that the guests’ score and Jev’s are both averages, so they are finer-grained by design, not because they read the text better.</p>
      </Reveal>
    </Chapter>
  );
}

/* ─── 04 · Cost ───────────────────────────────────────────────────────────── */

/** The prompt as the cache sees it: what every call shares, and what each call pays for in full. */
function PromptOrder() {
  const parts = [
    { label: "Reviews", sub: "≈110k characters", grow: 6, cached: true },
    { label: "Schema", sub: "same for every aspect", grow: 2.2, cached: true },
    { label: "Rate cleanliness", sub: "changes per call", grow: 2.2, cached: false },
  ];
  return (
    <div className="grid gap-3">
      <div className="flex gap-[3px] text-[12px]">
        {parts.map((p) => (
          <div key={p.label} className="min-w-0 rounded-md px-3 py-[10px]" style={{
            flexGrow: p.grow, flexBasis: 0,
            background: p.cached ? "var(--wash)" : "var(--claude)",
            border: `1px solid ${p.cached ? "var(--hair)" : "var(--claude)"}`,
            color: p.cached ? "var(--ink)" : "#fff",
          }}>
            <div className="font-medium leading-snug">{p.label}</div>
            <div className="leading-snug" style={{ opacity: 0.75 }}>{p.sub}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[12px]" style={{ color: "var(--muted)" }}>
        <span>cached once, reused by all eleven calls</span>
        <span>paid in full</span>
      </div>
    </div>
  );
}

export function ShortCost() {
  const c5 = data.ch5;
  const cents = (l: string) => c5.cost.find((c) => c.label === l)!.cents;
  const saved = (l: string) => c5.cache.find((c) => c.label === l)!.pct;
  const ratio = (m: string) => cents(`${m} Predict`) / cents(`${m} Joint`);
  const nice = (l: string) => l.replace(" Predict", ", aspects individually").replace(" Joint", ", aspects together");
  const rows = [
    { label: "Claude, aspects individually, no cache", value: c5.claudePredictNoCacheCents, color: "var(--noflat)" },
    ...c5.cost.map((c) => ({ label: nice(c.label), value: c.cents, color: COLOR[c.model as "Claude"] })),
  ];
  const notes = [
    {
      title: "Providers cache differently",
      text: `On Bedrock, Claude reads cached tokens at a 90% discount, which cuts the per-aspect bill by ${saved("Claude Predict").toFixed(0)}%. DeepSeek through OpenRouter gives about 50% off and hits the cache less reliably, saving only ${saved("DeepSeek Predict").toFixed(0)}%, so its per-aspect scoring costs ${ratio("DeepSeek").toFixed(0)}× its single call.`,
    },
    {
      title: "Batch or cache, not both",
      text: `Batch processing halves the price in exchange for answers within 24 hours, but it cannot be combined with caching. For Claude's per-aspect calls, caching saves more. For single calls, batching wins and brings DeepSeek to about ${(cents("DeepSeek Joint") / 2).toFixed(2)}¢ per hostel.`,
    },
    {
      title: "Cheap runs buy reliability",
      text: `At under a cent per hostel, scoring every hostel several times and averaging the runs becomes affordable, which addresses the run-to-run variation from chapter 02. Jev goes further: at ${cents("Jev").toFixed(2)}¢ per hostel it is the cheapest setup measured, and also the most stable between runs.`,
    },
  ];
  return (
    <Chapter id="cost" n="04" eyebrow="Cost" title={<>Caching sets the price,<br />and the prompt order.</>}
      lede={`Per token, Claude costs 5 to 31 times as much as DeepSeek. What matters is the cost per hostel, and that depends on how the scoring is designed and how each provider caches. Scoring one aspect per call means eleven calls over the same reviews. With caching they cost Claude ${ratio("Claude").toFixed(1)}× a single call, not 11×.`}>
      <Figure title="Reviews first, instruction last" note="Caching only reuses an identical prefix. So the pipeline reverses the usual prompt order, which puts the instruction first. The schema sits in the prefix too, so it has to be the same for every aspect. Whether the reversed order costs accuracy is untested: testing it means paying full price for every call.">
        <PromptOrder />
      </Figure>
      <Figure title={`Caching cuts Claude's per-aspect cost from ${c5.claudePredictNoCacheCents.toFixed(0)}¢ to ${cents("Claude Predict").toFixed(1)}¢ per hostel`}
        note="Real-time cost per hostel in US cents at listed prices. The grey bar is the same eleven calls priced without caching.">
        <HBars rows={rows} domain={[0, 70]} labelW={250} format={(v) => `${v < 1 ? v.toFixed(2) : v.toFixed(1)}¢`} />
      </Figure>
      <div className="mt-4 grid gap-x-12 gap-y-8 md:grid-cols-3">
        {notes.map((n) => (
          <Reveal key={n.title} className="grid content-start gap-2 border-t border-[var(--hair)] pt-5">
            <h3 className="text-[17px] font-light leading-snug">{n.title}</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{n.text}</p>
          </Reveal>
        ))}
      </div>
    </Chapter>
  );
}
