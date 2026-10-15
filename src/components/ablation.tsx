"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";
import { EASE } from "@/lib/tokens";

export const CONDITIONS = [
  { key: "Joint", color: "var(--c1)" },
  { key: "SchemaLeaks", color: "var(--c2)" },
  { key: "Predict", color: "var(--c3)" },
  { key: "Rate", color: "var(--c4)" },
] as const;
export type Cond = (typeof CONDITIONS)[number]["key"];

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

