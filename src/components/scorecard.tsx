"use client";

import { motion } from "motion/react";
import { Fragment, useMemo, useState } from "react";
import { data, num } from "@/lib/data";
import { COLOR, EASE } from "@/lib/tokens";
import { Segmented, Table, useChartInView } from "./ui";

const MODELS = [
  { key: "Predict", label: "Claude", color: COLOR.Claude },
  { key: "DeepSeek", label: "DeepSeek", color: COLOR.DeepSeek },
  { key: "Jev", label: "Jev", color: COLOR.Jev },
] as const;
type M = (typeof MODELS)[number]["key"];

type Row = {
  group: string;
  label: string;
  better: "up" | "down" | "ref";
  note?: string;
  v: Record<M, number | null>;
  fmt: (v: number) => string;
};

const mean = (xs: number[]) => {
  const v = xs.filter(Number.isFinite);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
};

function useRows(matched: boolean): Row[] {
  return useMemo(() => {
    const ds = data.ch4.dsCities;
    const inScope = (c: string) => !matched || ds.includes(c);
    const per = matched ? data.ch4.perAspectMatched : data.ch4.perAspect;
    const conv = (m: M) => mean(per.filter((r) => r.Aspect !== "Overall").map((r) => num(r, `${m} mean r`)));
    const val = (m: M) => mean(data.jevDiag.validity.filter((r) => r.model === m && inScope(String(r.city)))
      .flatMap((r) => data.meta.aspects.map((a) => num(r, a))));
    const aiic = (m: M) => mean(data.ch4.aiicByCity.filter((r) => inScope(String(r.City))).map((r) => num(r, m)));
    const cities = matched ? ds : data.meta.cities;
    const dir = (m: M, k: "cos" | "ratio") => mean(cities.map((c) => data.ch4.deltas[c]?.[m]?.[k] ?? NaN));
    const sel = matched ? data.ch4.selectiveMatched : data.ch4.selective;
    const subj = (m: M) => { const r = sel.find((x) => x.Source === m); return r ? num(r, "Subjective retention") : NaN; };
    const prof = matched ? data.ch4.profileMatched : data.ch4.profile;
    const pm = prof.find((r) => r.City === "Mean");
    const sd = (m: string, k: string) => { const r = data.ch5.sd.find((x) => x.Model === m); return r ? num(r, k) : NaN; };
    const h = data.ch6.headline;
    const rel = (b: string, col: string) => { const r = h.find((x) => x.budget === b); return r ? num(r, col) : NaN; };
    const res = (s: string) => { const r = data.ch7.resolution.find((x) => x.source === s); return r ? num(r, "coverage95") : NaN; };
    const cost = (l: string) => data.ch5.cost.find((c) => c.label === l)?.cents ?? NaN;
    const comp = (m: string) => data.ch5.schemaCompliance.find((c) => c.model === m)?.firstPass ?? NaN;
    const n = (x: number) => (Number.isFinite(x) ? x : null);
    const f2 = (v: number) => v.toFixed(2);
    return [
      { group: "Convergent validity", label: "Agreement with guests", better: "up", fmt: f2, v: { Predict: n(conv("Predict")), DeepSeek: n(conv("DeepSeek")), Jev: n(conv("Jev")) } },
      { group: "Convergent validity", label: "Agreement with non-flat reviews", better: "up", fmt: f2, v: { Predict: n(val("Predict")), DeepSeek: n(val("DeepSeek")), Jev: n(val("Jev")) } },
      { group: "Discriminant validity", label: "Aspects move together (AIIC)", better: "ref", note: "all guests 0.77 · non-flat reviews 0.61", fmt: f2, v: { Predict: n(aiic("Predict")), DeepSeek: n(aiic("DeepSeek")), Jev: n(aiic("Jev")) } },
      { group: "Discriminant validity", label: "Staff, atmosphere, value still linked", better: "ref", note: "share of the guests' correlation kept · non-flat reviews 0.85", fmt: f2, v: { Predict: n(subj("Predict")), DeepSeek: n(subj("DeepSeek")), Jev: n(subj("Jev")) } },
      { group: "Structural validity", label: "Same pattern as removing flat reviews", better: "up", fmt: f2, v: { Predict: n(dir("Predict", "cos")), DeepSeek: n(dir("DeepSeek", "cos")), Jev: n(dir("Jev", "cos")) } },
      { group: "Structural validity", label: "Size of the change", better: "ref", note: "× the change from removing flat reviews", fmt: (v) => `${v.toFixed(1)}×`, v: { Predict: n(dir("Predict", "ratio")), DeepSeek: n(dir("DeepSeek", "ratio")), Jev: n(dir("Jev", "ratio")) } },
      { group: "Structural validity", label: "Strengths and weaknesses match non-flat reviews", better: "up", fmt: f2, v: { Predict: pm ? n(num(pm, "Predict cos")) : null, DeepSeek: pm ? n(num(pm, "DeepSeek cos")) : null, Jev: pm ? n(num(pm, "Jev cos")) : null } },
      { group: "Reliability", label: "Variation between runs", better: "down", note: "spread across three identical runs", fmt: (v) => v.toFixed(3), v: { Predict: n(sd("Claude", "Noise SD")), DeepSeek: n(sd("DeepSeek", "Noise SD")), Jev: n(sd("Jev", "Noise SD")) } },
      { group: "Reliability", label: "Between hostels ÷ between runs", better: "up", fmt: (v) => `${v.toFixed(0)}×`, v: { Predict: n(sd("Claude", "Hotel/Noise")), DeepSeek: n(sd("DeepSeek", "Hotel/Noise")), Jev: n(sd("Jev", "Hotel/Noise")) } },
      { group: "Reliability", label: "Stability with ≈ 5 reviews", better: "up", note: "correlation with its score from all reviews · guests 0.72", fmt: f2, v: { Predict: n(rel("1250", "mean_r_llm")), DeepSeek: null, Jev: n(rel("1250", "mean_r_jev")) } },
      { group: "Reliability", label: "Stability with ≈ 43 reviews", better: "up", note: "guests 0.96", fmt: f2, v: { Predict: n(rel("10k", "mean_r_llm")), DeepSeek: null, Jev: n(rel("10k", "mean_r_jev")) } },
      { group: "Discriminative power", label: "Distinct values for 95% of scores", better: "up", note: "guests' average 44", fmt: (v) => v.toFixed(0), v: { Predict: n(res("Claude-Predict")), DeepSeek: n(res("DeepSeek-Predict")), Jev: n(res("Jev")) } },
      { group: "Operation", label: "Valid output on first try", better: "up", fmt: (v) => `${v.toFixed(v === 100 ? 0 : 1)}%`, v: { Predict: n(comp("Claude")), DeepSeek: n(comp("DeepSeek")), Jev: n(comp("Jev")) } },
      { group: "Operation", label: "Cost per hostel", better: "down", fmt: (v) => (v < 1 ? `${v.toFixed(2)}¢` : `${v.toFixed(1)}¢`), v: { Predict: n(cost("Claude Predict")), DeepSeek: n(cost("DeepSeek Predict")), Jev: n(cost("Jev")) } },
    ];
  }, [matched]);
}

export function scorecardTable(rows: Row[]): Table {
  return {
    columns: ["Criterion", "Claude", "DeepSeek", "Jev"],
    rows: rows.map((r) => [`${r.group} · ${r.label}`, r.v.Predict, r.v.DeepSeek, r.v.Jev]),
  };
}

export function Scorecard() {
  const [matched, setMatched] = useState(false);
  const rows = useRows(matched);
  const go = useChartInView();
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented label="cities" value={matched ? "m" : "all"} onChange={(v) => setMatched(v === "m")}
          options={[{ value: "all", label: "All cities per model" }, { value: "m", label: `Only the ${data.ch4.dsCities.length} DeepSeek cities` }]} />
        <div className="flex gap-4 text-[11px]" style={{ color: "var(--muted)" }}>
          <span><b style={{ color: "var(--ink)" }}>●</b> best in row</span><span>↑ ↓ better direction</span><span>○ no single best value</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[620px] grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div />
          {MODELS.map((m) => (
            <div key={m.key} className="flex items-center gap-2 pb-3 text-[13px] font-medium">
              <span className="h-[8px] w-[8px] rounded-full" style={{ background: m.color }} />{m.label}
            </div>
          ))}
          {rows.map((r, ri) => {
            const vals = MODELS.map((m) => r.v[m.key]).filter((x): x is number => x != null);
            const best = r.better === "up" ? Math.max(...vals) : r.better === "down" ? Math.min(...vals) : NaN;
            const max = Math.max(...vals.map(Math.abs));
            const head = ri === 0 || rows[ri - 1].group !== r.group;
            return (
              <Fragment key={r.label}>
                {head && <div className="eyebrow col-span-4 pb-1 pt-6">{r.group}</div>}
                <div className="py-3 pr-4 text-[13px]" style={{ borderTop: "1px solid var(--hair)" }}>
                  <span>{r.label}</span>
                  <span className="ml-1 text-[11px]" style={{ color: "var(--muted)" }}>{r.better === "up" ? "↑" : r.better === "down" ? "↓" : "○"}</span>
                  {r.note && <div className="text-[11px]" style={{ color: "var(--muted)" }}>{r.note}</div>}
                </div>
                {MODELS.map((m) => {
                  const v = r.v[m.key];
                  const isBest = v != null && v === best && vals.length > 1;
                  return (
                    <div key={m.key} className="py-3 pr-4" style={{ borderTop: "1px solid var(--hair)" }}>
                      {v == null ? (
                        <span className="text-[12px]" style={{ color: "var(--muted)" }}>not tested</span>
                      ) : (
                        <>
                          <div className="num flex items-center gap-2 text-[14px]" style={{ fontWeight: isBest ? 600 : 400 }}>
                            {isBest && <span className="text-[9px]">●</span>}{r.fmt(v)}
                          </div>
                          <div className="mt-[6px] h-[3px] w-full rounded-full" style={{ background: "var(--hair)" }}>
                            <motion.div className="h-full rounded-full" style={{ background: m.color }}
                              initial={{ width: 0 }} animate={go ? { width: `${(Math.abs(v) / max) * 100}%` } : undefined}
                              transition={{ duration: 0.9, ease: EASE, delay: 0.02 * ri }} />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { useRows as useScorecardRows };
