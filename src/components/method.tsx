"use client";

import { motion } from "motion/react";
import { data } from "@/lib/data";
import { COLOR, EASE } from "@/lib/tokens";
import { useChartInView } from "./ui";

/* ── Two framings: open columns, hairline divider, no inner boxes ──────────── */

function Num({ label, value, color, delay, go }: { label: string; value: string; color: string; delay: number; go: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={go ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.7, ease: EASE, delay }}>
      <div className="display num text-[44px]">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-2)" }}>
        <span className="h-[8px] w-[8px] rounded-full" style={{ background: color }} />{label}
      </div>
    </motion.div>
  );
}

export function Framing() {
  const go = useChartInView();
  return (
    <div className="grid md:grid-cols-2">
      <div className="pb-8 md:pb-0 md:pr-10">
        <div className="eyebrow mb-2">Usual framing</div>
        <div className="mb-8 text-[20px] font-light leading-snug">How far is the model from the guests?</div>
        <div className="flex items-end gap-6">
          <Num label="Guests · treated as truth" value="0.80" color={COLOR.Human} delay={0.1} go={go} />
          <motion.div className="mb-[26px] flex flex-1 items-center gap-2 text-[12px]" style={{ color: "var(--muted)" }}
            initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ delay: 0.6 }}>
            <span className="h-px flex-1" style={{ background: "var(--axis)" }} />
            <span className="num">error 0.10</span>
            <span className="h-px flex-1" style={{ background: "var(--axis)" }} />
          </motion.div>
          <Num label="Model" value="0.70" color={COLOR.Claude} delay={0.25} go={go} />
        </div>
        <p className="mt-8 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Earlier hospitality studies judge models this way. If the guests&apos; numbers carry a halo, the best-scoring model is the one that copies it.
        </p>
      </div>
      <div className="border-t pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0" style={{ borderColor: "var(--hair)" }}>
        <div className="eyebrow mb-2" style={{ color: "var(--ink)" }}>This thesis</div>
        <div className="mb-8 text-[20px] font-light leading-snug">Which of the two measures hostel quality better?</div>
        <div className="flex items-end gap-12">
          <Num label="Guests' scores" value="0.80" color={COLOR.Human} delay={0.35} go={go} />
          <Num label="Model score" value="0.70" color={COLOR.Claude} delay={0.5} go={go} />
        </div>
        <p className="mt-8 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Both can be wrong. Each goes through the same checks below.
        </p>
      </div>
    </div>
  );
}

/* ── Measurement-theory checklist, linked to the chapters that answer it ─── */

const CHECKS = [
  { group: "Convergent validity", name: "Agreement", q: "Do model and guests rank hostels the same way?", ch: "03", id: "agreement" },
  { group: "Discriminant validity", name: "Separation", q: "Do different aspects get different scores?", ch: "04", id: "structure" },
  { group: "Structural validity", name: "Right pattern", q: "Do the scores change the same way as when flat reviews are removed?", ch: "05 · 06", id: "direction" },
  { group: "Pipeline design", name: "Prompt effects", q: "Does the way the model is asked make aspects look alike?", ch: "07", id: "prompt" },
  { group: "Reliability", name: "Stability", q: "Does a score stay the same on a rerun, and with fewer reviews?", ch: "08 · 09", id: "reruns" },
  { group: "Discriminative power", name: "Precision", q: "How many different score values are really used?", ch: "10", id: "resolution" },
];

export function Checklist() {
  const go = useChartInView();
  return (
    <div>
      {CHECKS.map((c, i) => (
        <motion.a key={c.name} href={`#${c.id}`}
          className="group grid grid-cols-[1fr_auto] items-center gap-4 py-4 sm:grid-cols-[180px_1fr_auto]"
          style={{ borderTop: i ? "1px solid var(--hair)" : "none" }}
          initial={{ opacity: 0, x: -8 }} animate={go ? { opacity: 1, x: 0 } : undefined} transition={{ duration: 0.6, ease: EASE, delay: 0.06 * i }}>
          <div className="hidden sm:block">
            <div className="text-[11px]" style={{ color: "var(--muted)" }}>{c.group}</div>
            <div className="text-[14px] font-medium">{c.name}</div>
          </div>
          <div>
            <div className="text-[11px] sm:hidden" style={{ color: "var(--muted)" }}>{c.group} · {c.name}</div>
            <div className="text-[15px] font-light sm:text-[17px]">{c.q}</div>
          </div>
          <div className="num flex items-center gap-2 text-[12px] transition-transform group-hover:translate-x-1" style={{ color: "var(--muted)" }}>
            {c.ch}<span aria-hidden>→</span>
          </div>
        </motion.a>
      ))}
    </div>
  );
}

/* ── Pipeline: a numbered sequence on hairlines, no tiles ─────────────────── */

export function Pipeline() {
  const go = useChartInView();
  const steps = [
    { top: `${data.meta.scrapedProperties.toLocaleString("en-US")}`, sub: `properties in ${data.meta.scrapedCities} cities, scraped August 2025` },
    { top: "≥ 50", sub: "reviews required per property" },
    { top: `${data.meta.properties}`, sub: "hostels in 18 cities" },
    { top: "110k", sub: "characters of reviews per hostel, newest first (about 200–400 reviews)" },
  ];
  const models = [
    { name: "Claude Sonnet 4.6", note: "AWS Bedrock, temperature 0", c: COLOR.Claude },
    { name: "DeepSeek V3.2", note: "OpenRouter, 8 of the 18 cities", c: COLOR.DeepSeek },
    { name: "Jev 1.13", note: "OpenRouter Decisions API, no text output", c: COLOR.Jev },
  ];
  return (
    <div className="grid gap-12">
      <div className="grid gap-y-6 sm:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div key={s.sub} className="relative border-t pt-4 sm:pr-6" style={{ borderColor: i === steps.length - 1 ? "var(--ink)" : "var(--axis)" }}
            initial={{ opacity: 0, y: 10 }} animate={go ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.7, ease: EASE, delay: 0.12 * i }}>
            <div className="num mb-2 text-[11px]" style={{ color: "var(--muted)" }}>{String(i + 1).padStart(2, "0")}</div>
            <div className="display num text-[38px]">{s.top}</div>
            <div className="mt-1 text-[12px] leading-snug" style={{ color: "var(--ink-2)" }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid md:grid-cols-2">
        <motion.div className="pb-8 md:pb-0 md:pr-10" initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ delay: 0.6, duration: 0.8 }}>
          <div className="eyebrow mb-4">The review text goes to</div>
          <div className="grid">
            {models.map((m, i) => (
              <div key={m.name} className="flex items-baseline justify-between gap-4 py-2 text-[14px]" style={{ borderTop: i ? "1px solid var(--hair)" : "none" }}>
                <span className="inline-flex items-center gap-2"><span className="h-[8px] w-[8px] rounded-full" style={{ background: m.c }} />{m.name}</span>
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>{m.note}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[13px]" style={{ color: "var(--ink-2)" }}>and returns one score between 0 and 1 per aspect.</div>
        </motion.div>
        <motion.div className="border-t pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0" style={{ borderColor: "var(--hair)" }}
          initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : undefined} transition={{ delay: 0.75, duration: 0.8 }}>
          <div className="eyebrow mb-4">The guests&apos; own ratings</div>
          <div className="flex items-center gap-2 text-[14px]"><span className="h-[8px] w-[8px] rounded-full" style={{ background: COLOR.Human }} />Guests&apos; seven aspect scores, averaged per hostel</div>
          <div className="num mt-4 text-[22px] font-light">x′ = (x − 2) / 8</div>
          <div className="mt-2 text-[13px]" style={{ color: "var(--ink-2)" }}>maps Hostelworld&apos;s 2–10 scale onto the same 0–1 range.</div>
        </motion.div>
      </div>
    </div>
  );
}
