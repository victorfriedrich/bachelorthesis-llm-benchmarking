"use client";

import { motion } from "motion/react";
import { scaleBand, scaleLinear } from "d3-scale";
import { data } from "@/lib/data";
import { ASPECT_LABEL, COLOR, EASE } from "@/lib/tokens";
import { TipBox, TipRow, useChartInView, useTip, useWidth } from "./ui";

const toDisplay = (x: number) => 2 + 8 * x; // Hostelworld shows ratings on 2–10

const F = data.flat;

/** Vertical columns with one highlighted bar — value on the cap, 4px rounded data-end. */
export function Columns({
  items,
  highlight,
  height = 230,
  domain,
  format = (v: number) => `${v.toFixed(0)}%`,
  xTitle,
}: {
  items: { label: string; value: number }[];
  highlight: number[];
  height?: number;
  domain: [number, number];
  format?: (v: number) => string;
  xTitle?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const go = useChartInView();
  const m = { l: 6, r: 6, t: 22, b: xTitle ? 44 : 28 };
  const x = scaleBand().domain(items.map((d) => d.label)).range([m.l, w - m.r]).padding(0.34);
  const bw = Math.min(40, x.bandwidth());
  const y = scaleLinear().domain(domain).range([height - m.b, m.t]);
  return (
    <div ref={ref}>
      <div ref={tipRef} className="relative">
        <svg width={w} height={height} role="img" aria-label="column chart">
          <line x1={m.l} x2={w - m.r} y1={y(0)} y2={y(0)} stroke="var(--axis)" />
          {items.map((d, i) => {
            const cx = x(d.label)! + x.bandwidth() / 2;
            const hgt = y(0) - y(d.value);
            const hl = highlight.includes(i);
            return (
              <g key={d.label} onPointerMove={(e) => show(e, <TipRow color={hl ? "var(--ink)" : "var(--noflat)"} label={d.label} value={format(d.value)} />)} onPointerLeave={hide}>
                <rect x={x(d.label)!} y={m.t} width={x.bandwidth()} height={height - m.t - m.b} fill="transparent" />
                <motion.rect x={cx - bw / 2} width={bw} rx={4} fill={hl ? "var(--ink)" : "var(--noflat)"}
                  initial={{ y: y(0), height: 0 }} animate={go ? { y: y(d.value), height: hgt } : undefined}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.06 * i }} />
                <rect x={cx - bw / 2} y={y(0) - 4} width={bw} height={4} fill={hl ? "var(--ink)" : "var(--noflat)"} opacity={go ? 1 : 0} />
                <motion.text x={cx} y={y(d.value) - 7} textAnchor="middle" className={hl ? "label-strong num" : "tick num"}
                  initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ delay: 0.6 + 0.06 * i }}>
                  {format(d.value)}
                </motion.text>
                <text x={cx} y={height - m.b + 16} textAnchor="middle" className="tick">{d.label}</text>
              </g>
            );
          })}
          {xTitle && <text x={w / 2} y={height - 6} textAnchor="middle" className="tick">{xTitle}</text>}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

/** How many different scores does one review use across its seven aspects? */
export function DistinctChart() {
  const d = F.sample.distinct;
  const items = [
    ...d.slice(0, 4).map((x) => ({ label: `${x.k}`, value: x.pct })),
    { label: "5–7", value: d.slice(4).reduce((a, x) => a + x.pct, 0) },
  ];
  return <Columns items={items} highlight={[0]} domain={[0, 45]} xTitle="different scores within one review" />;
}

const SHORT: Record<string, string> = { cleanliness: "Clean", facilities: "Facil.", security: "Secur.", staff: "Staff", atmosphere: "Atmos.", location: "Loc.", value_for_money: "Value" };

/** Definition by example: seven identical scores vs seven considered ones. */
export function FlatDefinition() {
  const go = useChartInView();
  const rows = [
    { label: "Same score everywhere", note: "says nothing about which aspect was better", scores: [10, 10, 10, 10, 10, 10, 10], flat: true },
    { label: "Scores vary", note: "at least one aspect differs", scores: [10, 8, 10, 10, 8, 10, 6], flat: false },
  ];
  const aspects = data.meta.aspects;
  return (
    <div className="grid gap-7">
      {rows.map((r, ri) => (
        <div key={r.label}>
          <div className="mb-3 flex items-baseline gap-2 text-[13px]">
            <span className="font-medium">{r.label}</span>
            <span style={{ color: "var(--muted)" }}>{r.note}</span>
          </div>
          <div className="grid grid-cols-7 gap-y-2">
            {r.scores.map((sc, i) => (
              <motion.span key={i} className="num mx-auto grid h-[34px] w-[34px] place-items-center rounded-full text-[13px] sm:h-[40px] sm:w-[40px] sm:text-[14px]"
                style={{ background: r.flat ? "var(--ink)" : "transparent", color: r.flat ? "var(--surface)" : "var(--ink)", border: r.flat ? "none" : "1px solid var(--axis)" }}
                initial={{ opacity: 0, scale: 0.7 }} animate={go ? { opacity: 1, scale: 1 } : undefined}
                transition={{ duration: 0.5, ease: EASE, delay: 0.25 * ri + 0.05 * i }}>
                {sc}
              </motion.span>
            ))}
            {ri === rows.length - 1 && aspects.map((a) => (
              <span key={a} className="text-center text-[10px] sm:text-[11px]" style={{ color: "var(--muted)" }}>
                <span className="sm:hidden">{SHORT[a]}</span><span className="hidden sm:inline">{ASPECT_LABEL[a]}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** What dropping flat reviews costs: every aspect average moves down. */
export function ShiftChart() {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const go = useChartInView();
  const rows = F.sample.shift;
  const lw = w < 480 ? 86 : 110;
  const x = scaleLinear().domain([7, 9.5]).range([lw + 8, w - 16]);
  const rowH = 34, top = 24, h = top + rows.length * rowH;
  return (
    <div ref={ref}>
      <div ref={tipRef} className="relative">
        <svg width={w} height={h} role="img" aria-label="average score with and without flat reviews">
          {[7, 7.5, 8, 8.5, 9, 9.5].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={top - 6} y2={h} stroke="var(--hair)" />
              <text x={x(t)} y={11} textAnchor="middle" className="tick">{t.toFixed(1)}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const y = top + i * rowH + rowH / 2;
            return (
              <g key={r.aspect} onPointerMove={(e) => show(e, <div><div className="mb-1 text-[11px]" style={{ color: "var(--muted)" }}>{ASPECT_LABEL[r.aspect]}</div><TipRow color={COLOR.Human} label="all reviews" value={r.all.toFixed(2)} /><TipRow color={COLOR["No-Flat"]} label="without flat reviews" value={r.noflat.toFixed(2)} /></div>)} onPointerLeave={hide}>
                <rect x={0} y={y - rowH / 2} width={w} height={rowH} fill="transparent" />
                <text x={0} y={y + 4} className={r.aspect === "overall" ? "label-strong" : "label"}>{ASPECT_LABEL[r.aspect]}</text>
                <motion.line y1={y} y2={y} stroke="var(--axis)" strokeWidth={2} strokeLinecap="round"
                  initial={{ x1: x(r.all), x2: x(r.all) }} animate={go ? { x1: x(r.all), x2: x(r.noflat) } : undefined}
                  transition={{ duration: 1, ease: EASE, delay: 0.05 * i + 0.3 }} />
                <circle cx={x(r.all)} cy={y} r={5.5} fill={COLOR.Human} stroke="var(--surface)" strokeWidth={2} />
                <motion.circle cy={y} r={5.5} fill={COLOR["No-Flat"]} stroke="var(--surface)" strokeWidth={2}
                  initial={{ cx: x(r.all) }} animate={go ? { cx: x(r.noflat) } : undefined}
                  transition={{ duration: 1, ease: EASE, delay: 0.05 * i + 0.3 }} />
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

/* ─── how little the best hostels differ ─────────────────────────────────────── */

const TOP_N = 5;

/** Each city's TOP_N best-rated hostels on Hostelworld's 2–10 scale, tightest spread first. */
export const SKEW = (() => {
  const by = new Map<string, number[]>();
  for (const s of data.ch4.scatter) by.set(s.city, [...(by.get(s.city) ?? []), toDisplay(s.h)]);
  return [...by].map(([city, all]) => {
    const top = [...all].sort((a, b) => b - a).slice(0, TOP_N);
    return { city, n: all.length, top, best: top[0], last: top[top.length - 1], span: top[0] - top[top.length - 1] };
  }).sort((a, b) => a.span - b.span);
})();

export function SkewChart({ rows, highlight }: { rows: typeof SKEW; highlight: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const go = useChartInView();
  const lw = w < 480 ? 72 : 92, rw = 88;
  const x = scaleLinear().domain([9, 10]).range([lw + 8, w - rw]);
  const rowH = 30, top = 24, h = top + rows.length * rowH;
  return (
    <div ref={ref}>
      <div ref={tipRef} className="relative">
        <svg width={w} height={h} role="img" aria-label="the five best-rated hostels per city on a 2 to 10 scale">
          {[9, 9.25, 9.5, 9.75, 10].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={top - 6} y2={h} stroke="var(--hair)" />
              <text x={x(t)} y={11} textAnchor="middle" className="tick">{t}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const y = top + i * rowH + rowH / 2;
            const hl = r.city === highlight;
            const color = hl ? "var(--ink)" : "var(--noflat)";
            return (
              <g key={r.city} onPointerMove={(e) => show(e, <div><div className="mb-1 text-[11px]" style={{ color: "var(--muted)" }}>{r.city} · {TOP_N} best of {r.n} hostels</div><TipRow color={color} label="best" value={r.best.toFixed(2)} /><TipRow color={color} label={`${TOP_N}th best`} value={r.last.toFixed(2)} /></div>)} onPointerLeave={hide}>
                <rect x={0} y={y - rowH / 2} width={w} height={rowH} fill="transparent" />
                <text x={0} y={y + 4} className={hl ? "label-strong" : "label"}>{r.city}</text>
                <line x1={x(r.last)} x2={x(r.best)} y1={y} y2={y} stroke="var(--axis)" strokeWidth={2} strokeLinecap="round" />
                {r.top.map((v, k) => (
                  <motion.circle key={k} cx={x(v)} cy={y} r={4.5} fill={color} fillOpacity={0.75} stroke="var(--surface)" strokeWidth={1.5}
                    initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ duration: 0.6, delay: 0.04 * i + 0.02 * k }} />
                ))}
                <text x={w} y={y + 4} textAnchor="end" className={`${hl ? "label-strong" : "tick"} num`}>{r.last.toFixed(2)}–{r.best.toFixed(2)}</text>
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}
