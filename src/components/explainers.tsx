"use client";

import { motion } from "motion/react";
import { scaleLinear } from "d3-scale";
import { useMemo } from "react";
import { EASE } from "@/lib/tokens";
import { useChartInView, useWidth } from "./ui";

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

