"use client";

import { motion, useReducedMotion } from "motion/react";
import { scaleLinear, scaleBand } from "d3-scale";
import { line as d3line, curveMonotoneX } from "d3-shape";
import { interpolateLab } from "d3-interpolate";
import { useEffect, useMemo, useState } from "react";
import { EASE, fmt } from "@/lib/tokens";
import { TipBox, TipRow, useChartInView, useTip, useWidth } from "./ui";

export type Series = { key: string; label: string; color: string };

const ring = { stroke: "var(--surface)", strokeWidth: 2 } as const;

function useAnim() {
  const inView = useChartInView();
  const reduce = useReducedMotion();
  return { go: inView || !!reduce, reduce: !!reduce };
}

/* ═══ DotRows — one row per category, one dot per series, connector between ═══ */

export function DotRows({
  rows,
  series,
  domain,
  ticks,
  format = (v: number) => fmt(v),
  rowH = 34,
  labelW = 108,
  valueCols,
  refLine,
}: {
  rows: { label: string; values: Record<string, number | null | undefined> }[];
  series: Series[];
  domain: [number, number];
  ticks: number[];
  format?: (v: number) => string;
  rowH?: number;
  labelW?: number;
  valueCols?: string[]; // series keys whose values get a right-hand column
  refLine?: { value: number; label: string };
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const { go } = useAnim();
  const narrow = w < 520;
  const cols = w < 460 ? [] : valueCols ?? []; // phones: values live in the table view
  const colW = 52;
  const lw = narrow ? Math.min(labelW, 86) : labelW;
  const right = cols.length * colW + 12;
  const x = scaleLinear().domain(domain).range([lw + 8, w - right - 8]);
  const top = 26;
  const h = top + rows.length * rowH + 8;

  return (
    <div ref={ref} className="relative w-full">
      <div ref={tipRef} className="relative">
        <svg width={w} height={h} role="img" aria-label="dot plot">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={top - 6} y2={h - 4} stroke="var(--hair)" />
              <text x={x(t)} y={12} textAnchor="middle" className="tick">{format(t)}</text>
            </g>
          ))}
          {refLine && (
            <g>
              <line x1={x(refLine.value)} x2={x(refLine.value)} y1={top - 6} y2={h - 4} stroke="var(--axis)" />
            </g>
          )}
          {cols.map((k, i) => {
            const s = series.find((s) => s.key === k)!;
            const cx = w - right + 12 + i * colW + colW - 6;
            return (
              <text key={k} x={cx} y={12} textAnchor="end" className="tick">{s.label}</text>
            );
          })}
          {rows.map((r, i) => {
            const y = top + i * rowH + rowH / 2;
            const vals = series.map((s) => r.values[s.key]).filter((v): v is number => v != null && Number.isFinite(v));
            const lo = Math.min(...vals), hi = Math.max(...vals);
            return (
              <g key={r.label}>
                <text x={0} y={y + 4} className="label">{r.label}</text>
                {vals.length > 1 && (
                  <motion.line
                    y1={y} y2={y} stroke="var(--axis)" strokeWidth={2} strokeLinecap="round"
                    initial={{ x1: x(lo), x2: x(lo) }}
                    animate={go ? { x1: x(lo), x2: x(hi) } : undefined}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.05 * i }}
                  />
                )}
                {series.map((s) => {
                  const v = r.values[s.key];
                  if (v == null || !Number.isFinite(v)) return null;
                  return (
                    <g key={s.key}>
                      <motion.circle
                        cy={y} r={5.5} fill={s.color} {...ring}
                        initial={{ cx: x(lo), opacity: 0 }}
                        animate={go ? { cx: x(v), opacity: 1 } : undefined}
                        transition={{ duration: 0.9, ease: EASE, delay: 0.05 * i }}
                      />
                      <circle
                        cx={x(v)} cy={y} r={13} fill="transparent" tabIndex={0}
                        onPointerMove={(e) => show(e, <RowTip row={r} series={series} format={format} />)}
                        onPointerLeave={hide}
                        onFocus={(e) => show(e, <RowTip row={r} series={series} format={format} />)}
                        onBlur={hide}
                      />
                    </g>
                  );
                })}
                {cols.map((k, ci) => {
                  const v = r.values[k];
                  return (
                    <text key={k} x={w - right + 12 + ci * colW + colW - 6} y={y + 4} textAnchor="end" className="label num">
                      {v == null || !Number.isFinite(v) ? "—" : format(v)}
                    </text>
                  );
                })}
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

function RowTip({ row, series, format }: { row: { label: string; values: Record<string, number | null | undefined> }; series: Series[]; format: (v: number) => string }) {
  return (
    <div>
      <div className="mb-1 text-[11px]" style={{ color: "var(--muted)" }}>{row.label}</div>
      {series.map((s) => {
        const v = row.values[s.key];
        return v == null || !Number.isFinite(v) ? null : <TipRow key={s.key} color={s.color} label={s.label} value={format(v)} />;
      })}
    </div>
  );
}

/* ═══ Scatter — predicted vs human overall, with optional linear calibration ═══ */

export function Scatter({
  points,
  color,
  calibrated,
  xLabel,
  yLabel,
}: {
  points: { x: number; y: number; label: string }[];
  color: string;
  calibrated: boolean;
  xLabel: string;
  yLabel: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const { go } = useAnim();
  const size = Math.min(w, 520);
  const m = { l: 40, r: 12, t: 12, b: 36 };
  const { a, b, r } = useMemo(() => fit(points), [points]);
  const pts = points.map((p) => ({ ...p, px: calibrated ? a + b * p.x : p.x }));
  // stagger only the entrance; later moves (calibration, model switch) shift every point together
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!go) return;
    const t = setTimeout(() => setEntered(true), 1500);
    return () => clearTimeout(t);
  }, [go]);
  const x = scaleLinear().domain([0, 1]).range([m.l, size - m.r]);
  const y = scaleLinear().domain([0, 1]).range([size - m.b, m.t]);
  const mse = pts.reduce((s, p) => s + (p.px - p.y) ** 2, 0) / pts.length;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const mx = e.clientX - box.left + m.l, my = e.clientY - box.top + m.t;
    let best = -1, bd = 24 * 24;
    pts.forEach((p, i) => {
      const d = (x(p.px) - mx) ** 2 + (y(p.y) - my) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0) return hide();
    const p = pts[best];
    show(e, (
      <div>
        <div className="mb-1 text-[11px]" style={{ color: "var(--muted)" }}>{p.label}</div>
        <TipRow color={color} label={calibrated ? "model (calibrated)" : "model"} value={fmt(p.px)} />
        <TipRow color="var(--human)" label="human" value={fmt(p.y)} />
      </div>
    ));
  };

  return (
    <div ref={ref} className="w-full">
      <div ref={tipRef} className="relative mx-auto" style={{ width: size }}>
        <svg width={size} height={size} role="img" aria-label="predicted versus human overall score">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={m.t} y2={size - m.b} stroke="var(--hair)" />
              <line x1={m.l} x2={size - m.r} y1={y(t)} y2={y(t)} stroke="var(--hair)" />
              <text x={x(t)} y={size - m.b + 16} textAnchor="middle" className="tick">{t}</text>
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="tick">{t}</text>
            </g>
          ))}
          <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--axis)" />
          {pts.map((p, i) => (
            <motion.circle
              key={i} r={3.6} fill={color} fillOpacity={0.78} {...ring} strokeWidth={1}
              initial={{ cx: x(p.x), cy: y(p.y), opacity: 0 }}
              animate={go ? { cx: x(p.px), cy: y(p.y), opacity: 1 } : undefined}
              transition={{ duration: entered ? 0.7 : 0.9, ease: EASE, delay: go && !entered ? Math.min(i * 0.0015, 0.5) : 0 }}
            />
          ))}
          <rect x={m.l} y={m.t} width={size - m.l - m.r} height={size - m.t - m.b} fill="transparent" onPointerMove={onMove} onPointerLeave={hide} />
          <text x={(m.l + size - m.r) / 2} y={size - 4} textAnchor="middle" className="tick">{xLabel}</text>
          <text transform={`translate(11 ${(m.t + size - m.b) / 2}) rotate(-90)`} textAnchor="middle" className="tick">{yLabel}</text>
        </svg>
        <div className="mt-3 flex justify-center gap-6 text-[12px] num" style={{ color: "var(--ink-2)" }}>
          <span>r <b style={{ color: "var(--ink)" }}>{fmt(r, 3)}</b></span>
          <span>MSE <b style={{ color: "var(--ink)" }}>{fmt(mse, 3)}</b></span>
          <span>n <b style={{ color: "var(--ink)" }}>{pts.length}</b></span>
        </div>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

function fit(pts: { x: number; y: number }[]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; }
  const b = sxy / sxx;
  return { a: my - b * mx, b, r: sxy / Math.sqrt(sxx * syy) };
}

/* ═══ Heatmap — lower-triangle correlation matrix, labels on the diagonal ═══ */

export function useCorrColors() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => {
      const t = document.documentElement.dataset.theme;
      setDark(t ? t === "dark" : mq.matches);
    };
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return dark
    ? { neg: "#3987e5", mid: "#2a2a28", pos: "#e66767" }
    : { neg: "#256abf", mid: "#efeee9", pos: "#c43f3e" };
}

export function corrColor(v: number, css: { neg: string; mid: string; pos: string }) {
  const t = Math.max(-1, Math.min(1, v));
  return t < 0 ? interpolateLab(css.mid, css.neg)(-t) : interpolateLab(css.mid, css.pos)(t);
}

/* ═══ GroupedBars — columns ≤24px, 4px rounded data-end, 2px surface gap ═══ */

export function GroupedBars({
  groups,
  series,
  values,
  domain,
  ticks,
  format = (v: number) => fmt(v),
  height = 260,
  labelAll = true,
}: {
  groups: string[];
  series: Series[];
  values: Record<string, Record<string, number | null>>; // group → series → value
  domain: [number, number];
  ticks: number[];
  format?: (v: number) => string;
  height?: number;
  labelAll?: boolean;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const { go } = useAnim();
  const m = { l: 36, r: 8, t: 18, b: 30 };
  const x0 = scaleBand().domain(groups).range([m.l, w - m.r]).paddingInner(0.28).paddingOuter(0.12);
  const inner = x0.bandwidth();
  const bw = Math.min(24, (inner - (series.length - 1) * 2) / series.length);
  const gw = series.length * bw + (series.length - 1) * 2;
  const y = scaleLinear().domain(domain).range([height - m.b, m.t]);
  return (
    <div ref={ref} className="w-full">
      <div ref={tipRef} className="relative">
        <svg width={w} height={height} role="img" aria-label="grouped bar chart">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke={t === domain[0] ? "var(--axis)" : "var(--hair)"} />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="tick">{format(t)}</text>
            </g>
          ))}
          {groups.map((g) => {
            const gx = x0(g)! + (inner - gw) / 2;
            return (
              <g key={g}>
                {series.map((s, i) => {
                  const v = values[g]?.[s.key];
                  if (v == null || !Number.isFinite(v)) return null;
                  const bx = gx + i * (bw + 2);
                  const y0 = y(Math.max(domain[0], 0));
                  const hgt = Math.max(0, y0 - y(v));
                  return (
                    <g key={s.key}>
                      <motion.path
                        fill={s.color}
                        initial={{ d: roundedTop(bx, y0, bw, 0) }}
                        animate={go ? { d: roundedTop(bx, y0 - hgt, bw, hgt) } : undefined}
                        transition={{ duration: 0.9, ease: EASE, delay: 0.08 * i }}
                      />
                      <rect
                        x={bx - 1} y={m.t} width={bw + 2} height={height - m.t - m.b} fill="transparent" tabIndex={0}
                        onPointerMove={(e) => show(e, <TipRow color={s.color} label={`${s.label} · ${g}`} value={format(v)} />)}
                        onPointerLeave={hide}
                        onFocus={(e) => show(e, <TipRow color={s.color} label={`${s.label} · ${g}`} value={format(v)} />)}
                        onBlur={hide}
                      />
                      {labelAll && bw >= 14 && (
                        <motion.text
                          x={bx + bw / 2} y={y0 - hgt - 6} textAnchor="middle" className="tick num" style={{ fontSize: 10 }}
                          initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ delay: 0.8 }}
                        >
                          {format(v)}
                        </motion.text>
                      )}
                    </g>
                  );
                })}
                <text x={x0(g)! + inner / 2} y={height - 10} textAnchor="middle" className="label">{g}</text>
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

function roundedTop(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/* ═══ HBars — horizontal bars with value at the tip ═══ */

export function HBars({
  rows,
  domain,
  format = (v: number) => fmt(v),
  labelW = 132,
  rowH = 34,
  marker,
}: {
  rows: { label: string; value: number; color: string; note?: string; lo?: number; hi?: number }[];
  domain: [number, number];
  format?: (v: number) => string;
  labelW?: number;
  rowH?: number;
  marker?: { value: number; label: string };
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const { go } = useAnim();
  // narrow screens: each label sits above its bar instead of in a squeezed column
  const stacked = w < 520;
  const lw = stacked ? 0 : labelW;
  const rH = stacked ? rowH + 16 : rowH;
  const x = scaleLinear().domain(domain).range([lw, w - 64]);
  const h = rows.length * rH + (marker ? 22 : 4);
  return (
    <div ref={ref} className="w-full">
      <div ref={tipRef} className="relative">
        <svg width={w} height={h} role="img" aria-label="bar chart">
          {marker && (
            <g>
              <line x1={x(marker.value)} x2={x(marker.value)} y1={14} y2={h} stroke="var(--axis)" />
              <text x={x(marker.value)} y={10} textAnchor="middle" className="tick">{marker.label}</text>
            </g>
          )}
          {rows.map((r, i) => {
            const y = (marker ? 20 : 0) + i * rH + rH / 2 + (stacked ? 8 : 0);
            const bh = Math.min(16, rowH - 14);
            const x0 = x(domain[0]);
            const len = Math.max(2, x(r.value) - x0);
            return (
              <g key={r.label}>
                <text x={0} y={stacked ? y - bh / 2 - 6 : y + 4} className="label">{r.label}</text>
                {!stacked && <line x1={x0} x2={x0} y1={y - rowH / 2 + 4} y2={y + rowH / 2 - 4} stroke="var(--axis)" />}
                <motion.path
                  fill={r.color}
                  initial={{ d: roundedRight(x0, y - bh / 2, 0, bh) }}
                  animate={go ? { d: roundedRight(x0, y - bh / 2, len, bh) } : undefined}
                  transition={{ duration: 1, ease: EASE, delay: 0.06 * i }}
                />
                {r.lo != null && r.hi != null && (
                  <g stroke="var(--ink-2)" strokeWidth={1.2}>
                    <line x1={x(r.lo)} x2={x(r.hi)} y1={y} y2={y} />
                    <line x1={x(r.lo)} x2={x(r.lo)} y1={y - 4} y2={y + 4} />
                    <line x1={x(r.hi)} x2={x(r.hi)} y1={y - 4} y2={y + 4} />
                  </g>
                )}
                <motion.text
                  x={x0 + len + 8} y={y + 4} className="label-strong num"
                  initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ delay: 0.7 + 0.06 * i }}
                >
                  {format(r.value)}
                </motion.text>
                <rect
                  x={x0} y={y - rowH / 2} width={w - x0} height={rowH} fill="transparent" tabIndex={0}
                  onPointerMove={(e) => show(e, <TipRow color={r.color} label={r.note ?? r.label} value={format(r.value)} />)}
                  onPointerLeave={hide}
                  onFocus={(e) => show(e, <TipRow color={r.color} label={r.note ?? r.label} value={format(r.value)} />)}
                  onBlur={hide}
                />
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

function roundedRight(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h / 2, w);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}

/* ═══ Lines — 2px lines, crosshair tooltip, draw-in animation ═══ */

export function Lines({
  xs,
  xLabels,
  series,
  domain,
  ticks,
  height = 280,
  compact = false,
  format = (v: number) => fmt(v),
  title,
}: {
  xs: number[];
  xLabels: string[];
  series: (Series & { values: (number | null)[] })[];
  domain: [number, number];
  ticks: number[];
  height?: number;
  compact?: boolean;
  format?: (v: number) => string;
  title?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>(compact ? 240 : 640);
  const { tip, show, hide, ref: tipRef } = useTip();
  const { go } = useAnim();
  const [hover, setHover] = useState<number | null>(null);
  const m = compact ? { l: 30, r: 10, t: 10, b: 22 } : { l: 38, r: 100, t: 12, b: 30 };
  const x = scaleLinear().domain([xs[0], xs[xs.length - 1]]).range([m.l, w - m.r]);
  const y = scaleLinear().domain(domain).range([height - m.b, m.t]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - box.left + m.l;
    let best = 0;
    xs.forEach((v, i) => { if (Math.abs(x(v) - px) < Math.abs(x(xs[best]) - px)) best = i; });
    setHover(best);
    show(e, (
      <div>
        <div className="mb-1 text-[11px]" style={{ color: "var(--muted)" }}>{title ? `${title} · ` : ""}{xLabels[best]} characters</div>
        {series.map((s) => s.values[best] == null ? null : <TipRow key={s.key} color={s.color} label={s.label} value={format(s.values[best]!)} />)}
      </div>
    ));
  };

  // end labels: sort by height and push apart so neighbours never overlap
  const ends = series.map((s) => { const v = s.values[s.values.length - 1]; return v == null ? null : { key: s.key, y: y(v) + 4 }; })
    .filter((e): e is { key: string; y: number } => !!e).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 14);
  const labelY: Record<string, number> = Object.fromEntries(ends.map((e) => [e.key, e.y]));
  return (
    <div ref={ref} className="w-full">
      {title && <div className="mb-1 text-[12px] font-medium" style={{ color: "var(--ink)" }}>{title}</div>}
      <div ref={tipRef} className="relative">
        <svg width={w} height={height} role="img" aria-label={title ?? "line chart"}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--hair)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="tick">{format(t)}</text>
            </g>
          ))}
          {xs.map((v, i) => {
            // drop labels that would touch their left neighbour
            if (i > 0 && x(v) - x(xs[i - 1]) < (compact ? 34 : 28)) return null;
            return <text key={v} x={x(v)} y={height - (compact ? 6 : 10)} textAnchor="middle" className="tick">{xLabels[i]}</text>;
          })}
          {hover != null && <line x1={x(xs[hover])} x2={x(xs[hover])} y1={m.t} y2={height - m.b} stroke="var(--axis)" />}
          {series.map((s, si) => {
            const pts = s.values.map((v, i) => (v == null ? null : [x(xs[i]), y(v)] as [number, number])).filter(Boolean) as [number, number][];
            const d = d3line().curve(curveMonotoneX)(pts) ?? "";
            const last = pts[pts.length - 1];
            return (
              <g key={s.key}>
                <motion.path
                  d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={go ? { pathLength: 1 } : undefined}
                  transition={{ duration: 1.4, ease: EASE, delay: 0.12 * si }}
                />
                {pts.map(([px, py], i) => (
                  <motion.circle
                    key={i} cx={px} cy={py} r={compact ? 3 : 4} fill={s.color} {...ring}
                    initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined}
                    transition={{ delay: 0.12 * si + 0.3 * i }}
                  />
                ))}
                {!compact && last && s.values[s.values.length - 1] != null && (
                  <motion.text
                    x={last[0] + 10} y={labelY[s.key] ?? last[1] + 4} className="label"
                    initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ delay: 1.4 }}
                  >
                    {s.label}
                  </motion.text>
                )}
              </g>
            );
          })}
          <rect x={m.l} y={m.t} width={w - m.l - m.r} height={height - m.t - m.b} fill="transparent"
            onPointerMove={onMove} onPointerLeave={() => { hide(); setHover(null); }} />
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

/* ═══ DigitStrips — last-digit distribution, one neutral sequential hue ═══ */

export function DigitStrips({ rows }: { rows: { label: string; group: string; color: string; p: number[]; h: number }[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide, ref: tipRef } = useTip();
  const { go } = useAnim();
  const narrow = w < 560;
  const lw = narrow ? 132 : 184;
  const right = 84;
  const cell = Math.min(46, (w - lw - right) / 10);
  const rowH = Math.min(34, cell);
  const h = 22 + rows.length * (rowH + 4);
  const max = Math.max(...rows.flatMap((r) => r.p));
  return (
    <div ref={ref} className="w-full">
      <div ref={tipRef} className="relative">
        <svg width={w} height={h} role="img" aria-label="hundredths-digit distribution">
          {Array.from({ length: 10 }, (_, d) => (
            <text key={d} x={lw + d * cell + cell / 2} y={12} textAnchor="middle" className="tick">{d}</text>
          ))}
          <text x={w - 4} y={12} textAnchor="end" className="tick">digits used</text>
          {rows.map((r, i) => {
            const y = 22 + i * (rowH + 4);
            return (
              <g key={r.label}>
                <circle cx={6} cy={y + rowH / 2} r={4} fill={r.color} />
                <text x={16} y={y + rowH / 2 + 4} className="label">{r.label}</text>
                {r.p.map((v, d) => (
                  <motion.rect
                    key={d} x={lw + d * cell + 1} y={y} width={cell - 2} height={rowH} rx={6}
                    fill="var(--ink)"
                    initial={{ fillOpacity: 0 }}
                    animate={go ? { fillOpacity: 0.04 + 0.86 * (v / max) } : undefined}
                    transition={{ duration: 0.7, delay: 0.04 * i + 0.02 * d }}
                    onPointerMove={(e) => show(e, <TipRow color={r.color} label={`${r.label} · digit ${d}`} value={`${(v * 100).toFixed(1)}%`} />)}
                    onPointerLeave={hide}
                  />
                ))}
                <text x={w - 4} y={y + rowH / 2 + 4} textAnchor="end" className="label-strong num">{(2 ** r.h).toFixed(1)} <tspan className="tick">of 10</tspan></text>
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} />
      </div>
    </div>
  );
}

