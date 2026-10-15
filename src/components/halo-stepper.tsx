"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { data, num } from "@/lib/data";
import { ASPECT_LABEL, EASE } from "@/lib/tokens";
import { corrColor, useCorrColors } from "./charts";
import { useWidth } from "./ui";
import { Cond, RequestCard } from "./ablation";

/* The hero visual: one correlation matrix, averaged over the seven cities that ran every condition,
   stepping from guests' ratings to Claude with the aspect list hidden from the output schema. */

const A = data.meta.aspects;
const W = data.within;
const C = data.meta.sevenCities;
const LOC = A.indexOf("location");
const CLEAN = A.indexOf("cleanliness");
const SHORT: Record<string, string> = { cleanliness: "Clean", facilities: "Facil.", security: "Secur.", staff: "Staff", atmosphere: "Atmos.", location: "Loc.", value_for_money: "Value" };

function meanMatrix(key: string) {
  const ms = C.map((c) => data.ch4.matrices[c]?.[key]).filter((m): m is number[][] => !!m);
  return ms[0].map((row, i) => row.map((_, j) => ms.reduce((s, m) => s + m[i][j], 0) / ms.length));
}
const aiic = (m: number[][]) => {
  let s = 0, n = 0;
  for (let i = 0; i < m.length; i++) for (let j = 0; j < i; j++) { s += m[i][j]; n++; }
  return s / n;
};

export function HaloStepper() {
  const colors = useCorrColors();
  const reduce = useReducedMotion();
  const [ref, w] = useWidth<HTMLDivElement>(320);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const flatPct = Math.round(data.flat.sample.distinct.find((d) => d.k === 1)?.pct ?? NaN);
  const split = data.ch4.ablation.find((r) => r.City === "Mean")!;
  const sch = Math.round(num(split, "Schema-awareness share") * 100);

  const steps = useMemo(() => {
    const m = Object.fromEntries(["Human", "No-Flat", "Joint", "SchemeLeaks", "Predict"].map((k) => [k, meanMatrix(k)]));
    return [
      { key: "Human", pill: "Guests", who: "Guests' ratings", title: "One feeling, seven scores",
        text: `A hostel rated well on one aspect tends to be rated well on all seven. Psychologists call this the halo effect: one overall impression shapes every specific judgment. The clearest sign comes from guests of the same hostel, who all share one address: across ${W.hostels} hostels, guests who rate cleanliness 4 or lower rate the location ${Math.abs(W.buckets[0].locDev).toFixed(1)} points below their hostel's average.` },
      { key: "No-Flat", pill: "Varied scores only", who: "Guests whose scores vary", title: `Remove the ${flatPct}% who gave one number`,
        text: "Pairs that plausibly belong together barely move. Pairs involving staff or atmosphere become more uncorrelated, and location is almost completely decoupled. Dropping these reviews takes out halo without breaking links that are real, and the remaining reviews indicate how a more discriminating reviewer rates the aspects." },
      { key: "Joint", pill: "One answer", cond: "Joint" as Cond, who: "Claude · all aspects in one answer", title: "Let a model read the text",
        text: "Location separates completely. Cleanliness, facilities and security stay linked, as they plausibly should." },
      { key: "SchemeLeaks", pill: "One call per aspect", cond: "SchemaLeaks" as Cond, who: "Claude · one call per aspect, schema lists all seven", title: "Ask for one aspect at a time",
        text: "Separate calls pull the aspects further apart. But the output schema still names all seven, and the model can see them." },
      { key: "Predict", pill: "No aspect list", cond: "Predict" as Cond, who: "Claude · one call per aspect, no list", title: "Hide the list from the schema",
        text: `Hiding the aspect names accounts for ${sch}% of the drop from step 3.` },
    ].map((s) => ({ cond: undefined as Cond | undefined, ...s, m: m[s.key], aiic: aiic(m[s.key]) }));
  }, [flatPct, sch]);

  // autoplay only while the card is on screen and the reader isn't pointing at it
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { amount: 0.4 });
  const [hover, setHover] = useState(false);
  const playing = auto && !reduce && inView && !hover;
  const dwell = step === steps.length - 1 ? 13000 : 10000;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % steps.length), dwell);
    return () => clearTimeout(t);
  }, [playing, step, dwell, steps.length]);

  const pick = (i: number) => { setAuto(false); setStep(i); };
  const cur = steps[step];
  const lw = w < 420 ? 50 : 86;
  const cell = Math.max(36, Math.min(62, Math.floor((w - lw - 4) / (A.length - 1))));
  const full = cell >= 58;
  const name = (k: string) => (full ? ASPECT_LABEL[k] : SHORT[k]);
  const width = lw + (A.length - 1) * cell + 4, height = (A.length - 1) * cell + 26;

  const context = (() => {
    if (step === 0) return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <div className="eyebrow">Same hostel, same address</div>
        <WithinHostel />
      </div>
    );
    if (step === 1) return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <div className="eyebrow">What dropping these reviews changes</div>
        <PairShift h={steps[0].m} n={steps[1].m} />
      </div>
    );
    const c = cur.cond!;
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <div className="eyebrow">What Claude received{c === "Joint" ? "" : " · one request per aspect"}</div>
        {c === "Joint" ? <RequestCard cond={c} i={0} /> : ["cleanliness", "staff"].map((a, i) => <RequestCard key={a} cond={c} aspect={a} i={i} />)}
        {c !== "Joint" && <div className="pl-4 text-[12px]" style={{ color: "var(--muted)" }}>+ 9 more requests</div>}
        <div className="text-[11px]" style={{ color: "var(--muted)" }}>Highlighted: what differs from the plain one-aspect request.</div>
      </div>
    );
  })();

  return (
    <div id="steps" ref={cardRef} className="card p-5 sm:p-8" style={{ scrollMarginTop: 72 }}
      onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div className="mb-7 flex flex-wrap gap-2" role="tablist" aria-label="steps">
        {steps.map((s, i) => (
          <button key={s.key} role="tab" aria-selected={i === step} onClick={() => pick(i)}
            className="relative flex items-center gap-2 overflow-hidden rounded-full px-3 py-[6px] text-[12px] transition-colors"
            style={{ background: i === step ? "var(--ink)" : "transparent", color: i === step ? "var(--plane)" : "var(--ink-2)", border: `1px solid ${i === step ? "var(--ink)" : "var(--hair)"}` }}>
            <span className="num opacity-60">{i + 1}</span>{s.pill}
            {i === step && auto && !reduce && (
              <motion.span key={`${step}-${playing}`} aria-hidden className="absolute bottom-0 left-0 h-[2px]" style={{ background: "var(--plane)", opacity: 0.6 }}
                initial={{ width: "0%" }} animate={{ width: playing ? "100%" : "0%" }} transition={{ duration: playing ? dwell / 1000 : 0, ease: "linear" }} />
            )}
          </button>
        ))}
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div ref={ref} className="min-w-0">
          <div className="mb-6">
            <div className="mb-1 flex items-baseline justify-between text-[12px]" style={{ color: "var(--muted)" }}>
              <span>How much the seven aspects move together</span>
              <span className="display num text-[28px]" style={{ color: "var(--ink)" }}>{cur.aiic.toFixed(2)}</span>
            </div>
            <svg width="100%" height={30} role="img" aria-label="average correlation per step">
              <line x1="0" x2="100%" y1={15} y2={15} stroke="var(--hair)" />
              {steps.map((s, i) => (
                <motion.circle key={s.key} cy={15} cx={`${((s.aiic - 0.2) / 0.65) * 100}%`}
                  fill={i === step ? "var(--ink)" : "var(--axis)"} stroke="var(--surface)" strokeWidth={2}
                  style={{ cursor: "pointer" }} onClick={() => pick(i)} initial={false} animate={{ r: i === step ? 7 : 4.5 }} />
              ))}
            </svg>
            <div className="flex justify-between text-[11px]" style={{ color: "var(--muted)" }}><span>more independent</span><span>one overall feeling</span></div>
          </div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium">{cur.who}</span>
            <span className="num text-[12px]" style={{ color: "var(--muted)" }}>7 cities</span>
          </div>
          <svg width={width} height={height} role="img" aria-label={`correlation between aspects: ${cur.who}`}>
            {A.slice(1).map((ra, r) => (
              <text key={ra} x={lw - 8} y={r * cell + cell / 2 + 4} textAnchor="end" className="tick" style={{ fontSize: 11 }}>{name(ra)}</text>
            ))}
            {A.slice(0, -1).map((ca, c) => (
              <text key={ca} x={lw + c * cell + cell / 2} y={(A.length - 1) * cell + 16} textAnchor="middle" className="tick" style={{ fontSize: 11 }}>{name(ca)}</text>
            ))}
            {cur.m.map((row, i) => row.map((v, j) => {
              if (j >= i) return null;
              const x = lw + j * cell, y = (i - 1) * cell;
              const hl = (i === LOC && j === CLEAN) || (j === LOC && i === CLEAN);
              return (
                <g key={`${i}-${j}`}>
                  <motion.rect x={x + 2} y={y + 2} width={cell - 4} height={cell - 4} rx={7}
                    initial={false} animate={{ fill: corrColor(v, colors) }} transition={{ duration: reduce ? 0 : 0.9, ease: EASE, delay: reduce ? 0 : (i + j) * 0.015 }} />
                  {hl && <rect x={x + 1} y={y + 1} width={cell - 2} height={cell - 2} rx={8} fill="none" stroke="var(--ink)" strokeWidth={1.5} />}
                  <motion.text x={x + cell / 2} y={y + cell / 2 + 4} textAnchor="middle" className="num" style={{ fontSize: cell < 44 ? 9.5 : 11, fill: Math.abs(v) > 0.55 ? "var(--surface)" : "var(--ink-2)" }}
                    key={`${step}-${i}-${j}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{v.toFixed(2)}</motion.text>
                </g>
              );
            }))}
          </svg>
          <div className="mt-3 text-[12px]" style={{ color: "var(--muted)" }}>
            Correlation between two aspects across hostels. Dark red = they rise and fall together. Outlined: cleanliness × location.
          </div>
        </div>

        <motion.div key={step} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 lg:min-h-[520px]"
          initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
          <div>
            <div className="num mb-2 text-[12px]" style={{ color: "var(--muted)" }}>Step {step + 1} of {steps.length}</div>
            <div className="text-[24px] font-light leading-snug">{cur.title}</div>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{cur.text}</p>
          </div>
          {context}
        </motion.div>
      </div>
    </div>
  );

}

/** Three aspect pairs, all guests → reviews whose scores vary: real links hold, halo links loosen. */
const PAIRS: { a: string; b: string; kind: string; name?: string }[] = [
  { a: "facilities", b: "cleanliness", kind: "judged on the same rooms and bathrooms" },
  { a: "staff", b: "cleanliness", kind: "operational quality", name: "Service" },
  { a: "location", b: "cleanliness", kind: "the address vs. the rooms" },
];

function PairShift({ h, n }: { h: number[][]; n: number[][] }) {
  const reduce = useReducedMotion();
  const X = (v: number) => `${Math.max(0, v) * 100}%`;
  return (
    <div className="grid gap-4">
      {PAIRS.map((p, i) => {
        const ia = A.indexOf(p.a), ib = A.indexOf(p.b);
        const from = h[ia][ib], to = n[ia][ib];
        return (
          <div key={p.a + p.b}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span>{p.name ?? ASPECT_LABEL[p.a]} × {ASPECT_LABEL[p.b]} <span style={{ color: "var(--muted)" }}>· {p.kind}</span></span>
              <span className="num" style={{ color: "var(--ink-2)" }}>{from.toFixed(2)} → <b style={{ color: "var(--ink)" }}>{to.toFixed(2)}</b></span>
            </div>
            <svg width="100%" height={20} role="img" aria-label={`${p.a} and ${p.b}: ${from.toFixed(2)} to ${to.toFixed(2)}`}>
              <line x1="0" x2="100%" y1={10} y2={10} stroke="var(--hair)" />
              <motion.line y1={10} y2={10} stroke="var(--axis)" strokeWidth={2} x1={X(from)}
                initial={{ x2: X(from) }} animate={{ x2: X(to) }} transition={{ duration: reduce ? 0 : 0.9, ease: EASE, delay: reduce ? 0 : 0.2 + 0.12 * i }} />
              <circle cx={X(from)} cy={10} r={5} fill="var(--human)" opacity={0.35} />
              <motion.circle cy={10} r={6} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2}
                initial={{ cx: X(from) }} animate={{ cx: X(to) }} transition={{ duration: reduce ? 0 : 0.9, ease: EASE, delay: reduce ? 0 : 0.2 + 0.12 * i }} />
            </svg>
          </div>
        );
      })}
      <div className="flex justify-between text-[11px]" style={{ color: "var(--muted)" }}><span>0 · unrelated</span><span>correlation across hostels</span><span>1 · always together</span></div>
    </div>
  );
}

/** Location score relative to the same hostel's average location, by the cleanliness score the guest gave. */
function WithinHostel() {
  const reduce = useReducedMotion();
  const half = (v: number) => `${(Math.min(Math.abs(v), 2) / 2) * 50}%`; // ±2 points reach the edge
  return (
    <div className="grid gap-[10px]">
      <div className="grid grid-cols-[104px_minmax(0,1fr)_44px] gap-3 text-[11px]" style={{ color: "var(--muted)" }}>
        <span>Guests who rated cleanliness</span>
        <span className="grid grid-cols-2 self-end"><span className="pr-2 text-right">← location rated lower</span><span className="pl-2">higher →</span></span>
        <span />
      </div>
      {W.buckets.map((b, i) => (
        <div key={b.clean} className="grid grid-cols-[104px_minmax(0,1fr)_44px] items-center gap-3 text-[13px]">
          <span>{b.clean}</span>
          <div className="relative h-[22px]">
            <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: "var(--axis)" }} />
            <motion.div className="absolute top-[5px] h-[12px] rounded-[3px]"
              style={{ background: b.locDev < 0 ? "var(--div-neg)" : "var(--div-pos)", ...(b.locDev < 0 ? { right: "50%" } : { left: "50%" }) }}
              initial={{ width: reduce ? half(b.locDev) : "0%" }} animate={{ width: half(b.locDev) }}
              transition={{ duration: reduce ? 0 : 0.8, ease: EASE, delay: reduce ? 0 : 0.1 * i }} />
          </div>
          <span className="num text-right">{b.locDev > 0 ? "+" : "−"}{Math.abs(b.locDev).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
