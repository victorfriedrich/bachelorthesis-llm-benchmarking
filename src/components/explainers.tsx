"use client";

import { AnimatePresence, motion } from "motion/react";
import { scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";
import { ASPECT_LABEL, EASE, fmt } from "@/lib/tokens";
import { Segmented, useChartInView, useWidth } from "./ui";

const ring = { stroke: "var(--surface)", strokeWidth: 2 } as const;

/* deterministic RNG so every "simulation" renders identically */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normals(n: number, seed: number) {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const u = Math.max(1e-9, r()), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });
}

const ASPECTS7 = ["cleanliness", "facilities", "security", "staff", "atmosphere", "location", "value_for_money"];

/* ═══ 3. How Jev answers ══════════════════════════════════════════════════ */

export function JevAnatomy({ aspects }: { aspects: Record<string, { score: number; p: number[]; confidence: number }> }) {
  const go = useChartInView();
  const rows = ASPECTS7.filter((a) => aspects[a]);
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[92px_1fr_60px] gap-3 text-[11px] sm:grid-cols-[110px_1fr_72px_72px]" style={{ color: "var(--muted)" }}>
        <span />
        <span className="flex justify-between"><span>0<span className="hidden sm:inline"> · terrible</span></span><span><span className="hidden sm:inline">outstanding · </span>9</span></span>
        <span className="text-right">rating</span>
        <span className="hidden text-right sm:block">confidence</span>
      </div>
      {rows.map((a, ri) => {
        const { p, score, confidence } = aspects[a];
        return (
          <div key={a} className="grid grid-cols-[92px_1fr_60px] items-center gap-3 sm:grid-cols-[110px_1fr_72px_72px]">
            <span className="text-[12px]" style={{ color: "var(--ink-2)" }}>{ASPECT_LABEL[a]}</span>
            <div className="relative h-[34px]">
              <div className="absolute inset-0 grid grid-cols-10 items-end gap-[2px]">
                {p.map((v, i) => (
                  <motion.div key={i} className="rounded-t-[3px]" style={{ background: "var(--jev)", opacity: 0.25 + 0.75 * v }}
                    initial={{ height: 0 }} animate={go ? { height: `${Math.max(2, v * 100)}%` } : undefined}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.05 * ri + 0.02 * i }} />
                ))}
              </div>
              <motion.div className="absolute -bottom-[5px] h-[8px] w-[8px] rounded-full"
                style={{ background: "var(--ink)", boxShadow: "0 0 0 2px var(--surface)", marginLeft: -4 }}
                initial={{ left: "0%" }} animate={go ? { left: `${((score + 0.5) / 10) * 100}%` } : undefined}
                transition={{ duration: 1.1, ease: EASE, delay: 0.4 + 0.05 * ri }} />
            </div>
            <span className="num text-right text-[13px] font-medium">{fmt(score / 9)}</span>
            <span className="num hidden text-right text-[12px] sm:block" style={{ color: "var(--muted)" }}>{fmt(confidence)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ 6. Centring a profile ═══════════════════════════════════════════════ */

export function ProfileExplainer({ series }: { series: { key: string; label: string; color: string; values: number[] }[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [centred, setCentred] = useState(false);
  const h = 250, m = { l: 36, r: 12, t: 16, b: 34 };
  const shown = series.map((s) => {
    const mean = s.values.reduce((a, b) => a + b, 0) / s.values.length;
    return { ...s, v: centred ? s.values.map((v) => v - mean) : s.values };
  });
  const all = shown.flatMap((s) => s.v);
  const dom: [number, number] = centred ? [Math.min(...all) - 0.03, Math.max(...all) + 0.03] : [Math.min(0.2, Math.min(...all) - 0.05), 1];
  const y = scaleLinear().domain(dom).range([h - m.b, m.t]).nice();
  const step = (w - m.l - m.r) / ASPECTS7.length;
  const X = (i: number) => m.l + step * i + step / 2;
  return (
    <div ref={ref}>
      <div className="mb-3 flex justify-end">
        <Segmented label="profile view" options={[{ value: "raw", label: "Raw scores" }, { value: "centred", label: "Centred" }]}
          value={centred ? "centred" : "raw"} onChange={(v) => setCentred(v === "centred")} />
      </div>
      <svg width={w} height={h} role="img" aria-label="hostel aspect profile">
        {y.ticks(4).map((t) => (
          <g key={t}>
            <motion.line x1={m.l} x2={w - m.r} stroke={centred && Math.abs(t) < 1e-9 ? "var(--axis)" : "var(--hair)"} initial={false} animate={{ y1: y(t), y2: y(t) }} transition={{ duration: 0.8, ease: EASE }} />
            <motion.text x={m.l - 6} textAnchor="end" className="tick" initial={false} animate={{ y: y(t) + 4 }} transition={{ duration: 0.8, ease: EASE }}>{t.toFixed(2)}</motion.text>
          </g>
        ))}
        {ASPECTS7.map((a, i) => (
          <text key={a} x={X(i)} y={h - 10} textAnchor="middle" className="tick">{ASPECT_LABEL[a]}</text>
        ))}
        {shown.map((s) => (
          <g key={s.key}>
            <motion.path fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round"
              initial={false} animate={{ d: s.v.map((v, i) => `${i ? "L" : "M"}${X(i)},${y(v)}`).join("") }}
              transition={{ duration: 0.9, ease: EASE }} />
            {s.v.map((v, i) => (
              <motion.circle key={i} r={4.5} cx={X(i)} fill={s.color} {...ring} initial={false} animate={{ cy: y(v) }} transition={{ duration: 0.9, ease: EASE }} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ═══ 7. Rerun noise vs hotel spread (drawn at the measured SDs) ══════════ */

export function NoiseExplainer({ models }: { models: { key: string; label: string; color: string; noise: number; hotel: number; ratio: number }[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const go = useChartInView();
  const n = 14;
  const base = useMemo(() => normals(n, 7).sort((a, b) => a - b), []);
  const jit = useMemo(() => normals(n * 3, 11), []);
  const cols = w < 560 ? 1 : models.length;
  const pw = (w - (cols - 1) * 20) / cols;
  const ph = 190;
  return (
    <div ref={ref} className="grid min-w-0 gap-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {models.map((md, mi) => {
        const x = scaleLinear().domain([0, n - 1]).range([14, pw - 14]);
        const y = scaleLinear().domain([0.1, 0.9]).range([ph - 10, 10]);
        return (
          <div key={md.key}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] font-medium">{md.label}</span>
              <span className="num text-[12px]" style={{ color: "var(--muted)" }}>hostels ÷ runs <b style={{ color: "var(--ink)" }}>{Math.round(md.ratio)}×</b></span>
            </div>
            <svg width={pw} height={ph} role="img" aria-label={`${md.label} reruns`}>
              <line x1={0} x2={pw} y1={y(0.5)} y2={y(0.5)} stroke="var(--hair)" />
              {base.map((b, i) =>
                [0, 1, 2].map((r) => {
                  const v = 0.5 + md.hotel * b * 1.3 + md.noise * jit[i * 3 + r] * 1.3;
                  return (
                    <motion.circle key={`${i}-${r}`} cx={x(i) + (r - 1) * 3.2} r={3.2} fill={md.color} fillOpacity={0.85}
                      initial={{ cy: y(0.5), opacity: 0 }} animate={go ? { cy: y(v), opacity: 1 } : undefined}
                      transition={{ duration: 1, ease: EASE, delay: 0.1 * mi + 0.02 * i }} />
                  );
                }),
              )}
            </svg>
            <div className="mt-1 flex justify-between text-[11px] num" style={{ color: "var(--muted)" }}>
              <span>spread between runs {md.noise.toFixed(3)}</span><span>between hostels {md.hotel.toFixed(3)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Fade({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
