"use client";

import { AnimatePresence, motion } from "motion/react";
import { ReactNode, useState } from "react";
import { data, num } from "@/lib/data";
import { EASE, fmt } from "@/lib/tokens";
import { DotRows } from "./charts";
import { Segmented } from "./ui";

export const CONDITIONS = [
  { key: "Joint", color: "var(--c1)" },
  { key: "SchemaLeaks", color: "var(--c2)" },
  { key: "Predict", color: "var(--c3)" },
  { key: "Rate", color: "var(--c4)" },
] as const;
export type Cond = (typeof CONDITIONS)[number]["key"];

const FEATURES: { label: string; on: Record<Cond, boolean> }[] = [
  { label: "All aspects generated in one answer", on: { Joint: true, SchemaLeaks: false, Predict: false, Rate: false } },
  { label: "Output format lists every aspect", on: { Joint: true, SchemaLeaks: true, Predict: false, Rate: false } },
  { label: "Asked to predict what a guest would give", on: { Joint: true, SchemaLeaks: true, Predict: true, Rate: false } },
];

const ASPECTS_SHORT = ["security", "location", "staff", "atmosphere", "cleanliness", "facilities", "value", "overall"];

function Mark({ children, on }: { children: ReactNode; on: boolean }) {
  return (
    <span className="rounded-[4px] px-[3px] transition-colors duration-500"
      style={{ background: on ? "color-mix(in oklab, var(--claude) 18%, transparent)" : "transparent", color: on ? "var(--ink)" : "inherit" }}>
      {children}
    </span>
  );
}

export function RequestCard({ cond, aspect, i }: { cond: Cond; aspect?: string; i: number }) {
  const joint = cond === "Joint";
  const rate = cond === "Rate";
  const leak = cond === "SchemaLeaks" || joint;
  return (
    <motion.div className="py-1 pl-4 font-mono text-[11.5px] leading-[1.65]"
      style={{ borderLeft: "2px solid var(--axis)", color: "var(--ink-2)" }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.08 * i }}>
      <div style={{ color: "var(--muted)" }}>[ ~110k characters of reviews ]</div>
      <div className="mt-1">
        {rate ? <Mark on>Analyze the reviews and provide a numerical rating</Mark> : <Mark on={false}>Predict what numerical rating a typical user would assign</Mark>}{" "}
        {joint ? <>for <Mark on>each aspect: {ASPECTS_SHORT.slice(0, 4).join(", ")}, …</Mark></> : <>for the aspect <b style={{ color: "var(--ink)" }}>{aspect}</b>.</>}
      </div>
      <div className="mt-2" style={{ color: "var(--muted)" }}>
        schema: {leak ? <Mark on>{"{ security, location, staff, atmosphere, … }"}</Mark> : <span>{"[ { aspect, rating } ]"}</span>}
      </div>
    </motion.div>
  );
}

function Answer({ cond }: { cond: Cond }) {
  const vals = [0.82, 0.91, 0.97, 0.95, 0.82, 0.68, 0.72];
  if (cond === "Joint") {
    return (
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 font-mono text-[11.5px]">
        {vals.map((v, i) => (
          <motion.span key={i} className="inline-flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + 0.25 * i }}>
            <span style={{ color: "var(--muted)" }}>{ASPECTS_SHORT[i]}</span>
            <span className="num" style={{ color: "var(--ink)" }}>{v.toFixed(2)}</span>
            {i < vals.length - 1 && <span style={{ color: "var(--claude)" }}>→</span>}
          </motion.span>
        ))}
        <div className="mt-1 w-full text-[11px]" style={{ color: "var(--muted)" }}>each score is written after, and can lean on, the ones before it</div>
      </div>
    );
  }
  return (
    <div className="font-mono text-[11.5px]" style={{ color: "var(--muted)" }}>
      one answer per aspect · none sees the others
    </div>
  );
}

export function PromptAnatomy() {
  const [cond, setCond] = useState<Cond>("Joint");
  const seven = data.ch4.aiicByCity.filter((r) => data.meta.sevenCities.includes(String(r.City)));
  const aiic = (k: string) => {
    const v = seven.map((r) => num(r, k)).filter(Number.isFinite);
    return v.reduce((a, b) => a + b, 0) / v.length;
  };
  return (
    <div>
      <div className="mb-6">
        <Segmented label="condition" value={cond} onChange={setCond} options={CONDITIONS.map((c) => ({ value: c.key, label: c.key }))} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="eyebrow mb-3">{cond === "Joint" ? "One request" : "One request per aspect (11 in total)"}</div>
          <AnimatePresence mode="wait">
            <motion.div key={cond} className="grid gap-4" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {cond === "Joint" ? <RequestCard cond={cond} i={0} /> : ["cleanliness", "staff", "location"].map((a, i) => <RequestCard key={a} cond={cond} aspect={a} i={i} />)}
              {cond !== "Joint" && <div className="pl-2 text-[12px]" style={{ color: "var(--muted)" }}>+ 8 more</div>}
              <div className="mt-3"><Answer cond={cond} /></div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div>
          <div className="eyebrow mb-3">What changes</div>
          <div className="grid">
            {FEATURES.map((f, i) => (
              <div key={f.label} className="flex items-center justify-between gap-4 py-3 text-[13px]" style={{ borderTop: i ? "1px solid var(--hair)" : "none" }}>
                <span style={{ color: f.on[cond] ? "var(--ink)" : "var(--muted)" }}>{f.label}</span>
                <motion.span className="block h-[12px] w-[12px] shrink-0 rounded-full" initial={false}
                  animate={{ backgroundColor: f.on[cond] ? "var(--claude)" : "rgba(0,0,0,0)", borderColor: f.on[cond] ? "var(--claude)" : "var(--axis)" }}
                  style={{ borderWidth: 1.5, borderStyle: "solid" }} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-end justify-between border-t pt-5" style={{ borderColor: "var(--hair)" }}>
            <div className="text-[12px]" style={{ color: "var(--muted)" }}>How much the aspects move together<br />(mean AIIC, 7 cities)</div>
            <motion.div key={cond} className="display num text-[48px]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              {fmt(aiic(cond))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Deck chart: each city's AIIC rescaled so Predict = 0 and Joint = 1. */
export function NormalizedAIIC() {
  const rows = data.ch4.aiicByCity.filter((r) => data.meta.sevenCities.includes(String(r.City)));
  const norm = (r: (typeof rows)[number], k: string) => (num(r, k) - num(r, "Predict")) / (num(r, "Joint") - num(r, "Predict"));
  const out = rows.map((r) => ({ label: String(r.City), values: Object.fromEntries(CONDITIONS.map((c) => [c.key, norm(r, c.key)])) }));
  const mean = (k: string) => out.reduce((s, r) => s + (r.values[k] as number), 0) / out.length;
  out.push({ label: "Mean", values: Object.fromEntries(CONDITIONS.map((c) => [c.key, mean(c.key)])) });
  return (
    <DotRows rows={out} series={CONDITIONS.map((c) => ({ key: c.key, label: c.key, color: c.color }))}
      domain={[-1.2, 1.2]} ticks={[-1, -0.5, 0, 0.5, 1]} format={(v) => (Math.abs(v) < 1e-9 ? "0" : v.toFixed(1))} valueCols={["SchemaLeaks"]} />
  );
}
