"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { data } from "@/lib/data";
import { ASPECT_LABEL, COLOR, EASE, fmt } from "@/lib/tokens";
import { corrColor, useCorrColors } from "./charts";
import { Segmented, TipBox, TipRow, useChartInView, useTip, useWidth } from "./ui";

export const DIR_MODELS = [
  { key: "Predict", label: "Claude", color: COLOR.Claude },
  { key: "DeepSeek", label: "DeepSeek", color: COLOR.DeepSeek },
  { key: "Jev", label: "Jev", color: COLOR.Jev },
] as const;
export type DirModel = (typeof DIR_MODELS)[number]["key"];

const A = data.meta.aspects;
const RANGE = 0.6; // colour saturates at a shift of ±0.6

/** Average the per-city Δ matrices (or pick one city). */
export function deltaFor(city: string, model: DirModel) {
  const cities = city === "All cities" ? data.meta.cities : [city];
  const got = cities.map((c) => data.ch4.deltas[c]?.[model]).filter(Boolean);
  if (!got.length) return null;
  const avg = (k: "nf" | "m") => got[0]![k].map((row, i) => row.map((_, j) => got.reduce((s, g) => s + g![k][i][j], 0) / got.length));
  return {
    nf: avg("nf"), m: avg("m"),
    cos: got.reduce((s, g) => s + g!.cos, 0) / got.length,
    ratio: got.reduce((s, g) => s + g!.ratio, 0) / got.length,
    cities: got.length,
  };
}

function DeltaMap({ m, title }: { m: number[][]; title: string }) {
  const [ref, w] = useWidth<HTMLDivElement>(260);
  const { tip, show, hide, ref: tipRef } = useTip();
  const colors = useCorrColors();
  const go = useChartInView();
  const n = A.length;
  const cell = Math.max(20, Math.min(46, Math.floor((w - 4) / n)));
  const labels = A.map((a) => ASPECT_LABEL[a]);
  const norm = Math.sqrt(m.reduce((s, row, i) => s + row.slice(0, i).reduce((t, v) => t + v * v, 0), 0));
  return (
    <div ref={ref} className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium">{title}</span>
        <span className="num text-[12px]" style={{ color: "var(--muted)" }}>size of change {norm.toFixed(2)}</span>
      </div>
      <div ref={tipRef} className="relative">
        <svg width={n * cell + 4} height={n * cell + 4} role="img" aria-label={`${title} change in correlation`}>
          {m.map((row, i) => row.map((v, j) => {
            if (j > i) return null;
            if (i === j) return <text key={`${i}${j}`} x={j * cell + cell - 4} y={i * cell + cell / 2 + 4} textAnchor="end" className="tick" style={{ fontSize: 9.5 }}>{labels[i].slice(0, cell < 30 ? 2 : 5)}</text>;
            const c = corrColor(v / RANGE, colors);
            return (
              <motion.rect key={`${i}${j}`} x={j * cell + 1.5} y={i * cell + 1.5} width={cell - 3} height={cell - 3} rx={6}
                initial={false} animate={{ fill: go ? c : colors.mid }} transition={{ duration: 0.8, ease: EASE, delay: go ? (i + j) * 0.02 : 0 }}
                onPointerMove={(e) => show(e, <TipRow color={c} label={`${labels[i]} × ${labels[j]}`} value={`${v > 0 ? "+" : ""}${v.toFixed(2)}`} />)}
                onPointerLeave={hide} />
            );
          }))}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

export function DeltaPair({ city, model }: { city: string; model: DirModel }) {
  const d = deltaFor(city, model);
  const md = DIR_MODELS.find((x) => x.key === model)!;
  const colors = useCorrColors();
  if (!d) return <div className="py-16 text-center text-[13px]" style={{ color: "var(--muted)" }}>{md.label} was not run for {city}.</div>;
  return (
    <div>
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <DeltaMap m={d.nf} title="Guests whose scores vary" />
        <div className="text-center">
          <div className="display num text-[34px]">{fmt(d.cos)}</div>
          <div className="text-[11px]" style={{ color: "var(--muted)" }}>pattern similarity<br />(1 = identical)</div>
        </div>
        <DeltaMap m={d.m} title={`${md.label} reading the text`} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] num" style={{ color: "var(--muted)" }}>
        <span>aspects moved apart</span>
        <div className="h-[8px] w-[140px] rounded-full" style={{ background: `linear-gradient(90deg, ${[-1, -0.5, 0, 0.5, 1].map((s) => corrColor(s, colors)).join(",")})` }} />
        <span>moved together</span>
        <span className="ml-2">change in correlation compared with all guests</span>
      </div>
    </div>
  );
}

/** Both shifts as arrows from the same origin: angle = direction, length = size. */
export function AngleDial({ city, model, onPick }: { city: string; model: DirModel; onPick: (m: DirModel) => void }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [unit, setUnit] = useState(false);
  const go = useChartInView();
  const h = 300;
  const ox = 44, oy = h - 44;
  const arrows = DIR_MODELS.map((m) => ({ ...m, d: deltaFor(city, m.key) })).filter((a) => a.d);
  const th = (c: number) => Math.acos(Math.max(-1, Math.min(1, c)));
  const len = (a: (typeof arrows)[number]) => (unit ? 1 : a.d!.ratio);
  const maxX = Math.max(1, ...arrows.map((a) => len(a) * Math.cos(th(a.d!.cos))));
  const maxY = Math.max(0.2, ...arrows.map((a) => len(a) * Math.sin(th(a.d!.cos))));
  const labelW = 150;
  const L0 = Math.min((w - ox - labelW - 30) / maxX, (oy - 28) / maxY);
  const ticks = [0, 15, 30, 45, 60, 75, 90];
  const maxLen = Math.max(1, ...arrows.map(len));
  const R = Math.min(maxLen * L0, oy - 20);
  // tip positions + de-collided label rows in a column to the right of the tips
  const tips = arrows.map((a) => {
    const t = th(a.d!.cos), L = len(a) * L0;
    return { key: a.key, tx: ox + L * Math.cos(t), ty: oy - L * Math.sin(t) };
  });
  const colX = Math.max(...tips.map((p) => p.tx)) + 26;
  const order = [...tips].sort((p, q) => p.ty - q.ty);
  const labelY: Record<string, number> = {};
  order.forEach((p, i) => { labelY[p.key] = Math.max(p.ty, i ? labelY[order[i - 1].key] + 20 : 14); });
  return (
    <div ref={ref}>
      <div className="mb-3 flex justify-end">
        <Segmented label="arrow length" value={unit ? "unit" : "raw"} onChange={(v) => setUnit(v === "unit")}
          options={[{ value: "raw", label: "Size of change" }, { value: "unit", label: "Direction only" }]} />
      </div>
      <svg width={w} height={h} role="img" aria-label="direction of change, compared as angles">
        <defs>
          {[{ key: "nf", color: "var(--noflat)" }, ...DIR_MODELS.map((m) => ({ key: m.key, color: m.color }))].map((m) => (
            <marker key={m.key} id={`dial-${m.key}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0L10,5L0,10z" fill={m.color} />
            </marker>
          ))}
        </defs>
        <path d={`M${ox + R},${oy} A${R},${R} 0 0 0 ${ox},${oy - R}`} fill="none" stroke="var(--hair)" />
        {ticks.map((t) => {
          const r = (t * Math.PI) / 180;
          return (
            <g key={t}>
              <line x1={ox} y1={oy} x2={ox + R * Math.cos(r)} y2={oy - R * Math.sin(r)} stroke="var(--hair)" />
              <text x={ox + (R + 12) * Math.cos(r)} y={oy - (R + 12) * Math.sin(r) + 4} textAnchor="middle" className="tick">{t}°</text>
            </g>
          );
        })}
        <motion.line x1={ox} y1={oy} y2={oy} stroke="var(--noflat)" strokeWidth={3} markerEnd="url(#dial-nf)"
          initial={{ x2: ox }} animate={go ? { x2: ox + L0 } : undefined} transition={{ duration: 0.9, ease: EASE }} />
        <text x={ox + L0} y={oy + 22} textAnchor="middle" className="label">Guests whose scores vary</text>
        {arrows.map((a, i) => {
          const t = th(a.d!.cos);
          const { tx, ty } = tips.find((p) => p.key === a.key)!;
          const on = a.key === model;
          return (
            <g key={a.key} style={{ cursor: "pointer" }} onClick={() => onPick(a.key)} opacity={on ? 1 : 0.35}>
              <motion.line x1={ox} y1={oy} stroke={a.color} strokeWidth={on ? 3 : 2} markerEnd={`url(#dial-${a.key})`}
                initial={{ x2: ox, y2: oy }} animate={go ? { x2: tx, y2: ty } : undefined} transition={{ duration: 1, ease: EASE, delay: 0.2 + 0.12 * i }} />
              <line x1={ox} y1={oy} x2={tx} y2={ty} stroke="transparent" strokeWidth={16} />
              <motion.line stroke="var(--axis)" strokeWidth={1} initial={false}
                animate={{ x1: tx + 6, y1: ty, x2: colX - 6, y2: labelY[a.key] }} transition={{ duration: 1, ease: EASE }} />
              <motion.text className={on ? "label-strong" : "label"} x={colX} initial={false} animate={{ y: labelY[a.key] + 4 }} transition={{ duration: 1, ease: EASE }}>
                {a.label} · {Math.round((t * 180) / Math.PI)}°{unit ? "" : ` · ${a.d!.ratio.toFixed(1)}×`}
              </motion.text>
            </g>
          );
        })}
        <circle cx={ox} cy={oy} r={5} fill="var(--human)" stroke="var(--surface)" strokeWidth={2} />
        <text x={ox} y={oy + 22} textAnchor="middle" className="label">all guests</text>
      </svg>
    </div>
  );
}
