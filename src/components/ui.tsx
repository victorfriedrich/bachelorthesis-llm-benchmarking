"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import {
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { EASE } from "@/lib/tokens";

/* ── responsive width ─────────────────────────────────────────────────────── */

export function useWidth<T extends HTMLElement>(fallback = 640): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ── reveal-on-scroll: charts animate once when they enter the viewport ───── */

const InViewCtx = createContext(true);
export const useChartInView = () => useContext(InViewCtx);

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      <InViewCtx.Provider value={inView || !!reduce}>{children}</InViewCtx.Provider>
    </motion.div>
  );
}

/* ── tooltip ──────────────────────────────────────────────────────────────── */

export type Tip = { x: number; y: number; content: ReactNode } | null;

export function useTip() {
  const [tip, setTip] = useState<Tip>(null);
  const ref = useRef<HTMLDivElement>(null);
  const show = useCallback((e: React.PointerEvent | React.FocusEvent, content: ReactNode) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    let x: number, y: number;
    if ("clientX" in e) {
      x = e.clientX - box.left;
      y = e.clientY - box.top;
    } else {
      const r = (e.target as Element).getBoundingClientRect();
      x = r.left + r.width / 2 - box.left;
      y = r.top - box.top;
    }
    setTip({ x: Math.min(Math.max(x, 70), box.width - 70), y, content });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide, ref };
}

export function TipBox({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div className="tip" style={{ left: tip.x, top: tip.y }} role="status">
      {tip.content}
    </div>
  );
}

export function TipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ width: 12, height: 2, background: color, borderRadius: 2, display: "inline-block" }} />
      <span className="num font-semibold" style={{ color: "var(--ink)" }}>{value}</span>
      <span style={{ color: "var(--ink-2)" }}>{label}</span>
    </div>
  );
}

/* ── legend: mirrors the mark (dot / line / rect) ─────────────────────────── */

export function Legend({ items }: { items: { label: string; color: string; mark?: "dot" | "line" | "rect" }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]" style={{ color: "var(--ink-2)" }}>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          {it.mark === "line" ? (
            <span style={{ width: 16, height: 2, background: it.color, borderRadius: 2 }} />
          ) : it.mark === "rect" ? (
            <span style={{ width: 10, height: 10, background: it.color, borderRadius: 3 }} />
          ) : (
            <span style={{ width: 8, height: 8, background: it.color, borderRadius: 99 }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ── segmented control ────────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[] | { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const opts = (options as (T | { value: T; label: string })[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div className="seg" role="group" aria-label={label}>
      {opts.map((o) => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── checkbox: a single on/off option beside a figure ─────────────────────── */

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: checked ? "var(--ink)" : "var(--ink-2)" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-[14px] w-[14px] cursor-pointer" style={{ accentColor: "var(--ink)" }} />
      {label}
    </label>
  );
}

/* ── figure frame with table view ─────────────────────────────────────────── */

export type Table = { columns: string[]; rows: (string | number | null)[][] };

export function Figure({
  title,
  note,
  legend,
  controls,
  table,
  children,
  className = "",
  plain = false,
}: {
  title: string;
  note?: ReactNode;
  legend?: ReactNode;
  controls?: ReactNode;
  table?: Table;
  children: ReactNode;
  className?: string;
  /** no card chrome: for figures that share a card with a sibling */
  plain?: boolean;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Reveal className={`${plain ? "" : "card p-5 sm:p-7"} ${className}`}>
      <figure className="m-0">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <figcaption>
            <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{title}</div>
            {note && <div className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>{note}</div>}
          </figcaption>
          <div className="flex items-center gap-2">
            {controls}
            {table && (
              <button
                onClick={() => setShowTable((s) => !s)}
                aria-pressed={showTable}
                className="rounded-full px-3 py-[5px] text-[12px] transition-colors"
                style={{ border: "1px solid var(--hair)", color: showTable ? "var(--ink)" : "var(--muted)", background: showTable ? "var(--wash)" : "transparent" }}
              >
                {showTable ? "Chart" : "Table"}
              </button>
            )}
          </div>
        </div>
        {legend && <div className="mb-4">{legend}</div>}
        {showTable && table ? <DataTable table={table} /> : children}
      </figure>
    </Reveal>
  );
}

export function DataTable({ table }: { table: Table }) {
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-[12px] num" style={{ color: "var(--ink-2)" }}>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} className="sticky top-0 py-2 pr-4 text-left font-medium" style={{ background: "var(--surface)", color: "var(--ink)", borderBottom: "1px solid var(--hair)" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--hair)" }}>
              {r.map((v, j) => (
                <td key={j} className="py-[6px] pr-4">
                  {typeof v === "number" ? (Number.isFinite(v) ? +v.toFixed(3) : "—") : v ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── chapter section ──────────────────────────────────────────────────────── */

export function Chapter({
  id,
  n,
  eyebrow,
  title,
  lede,
  children,
}: {
  id: string;
  n: string;
  eyebrow: string;
  title?: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-[1160px] px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-20" style={{ scrollMarginTop: 72 }}>
      <Reveal>
        <div className="mb-10 grid gap-6 sm:mb-14 sm:grid-cols-[120px_1fr]">
          <div className="display text-[44px] sm:text-[64px]" style={{ color: "var(--hair)" }} aria-hidden>
            {n}
          </div>
          <div>
            <div className="eyebrow mb-3">{eyebrow}</div>
            {title && <h2 className="headline text-[32px] sm:text-[46px]">{title}</h2>}
            {lede && <p className={`caption ${title ? "mt-4" : ""}`}>{lede}</p>}
          </div>
        </div>
      </Reveal>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:gap-6">{children}</div>
    </section>
  );
}

