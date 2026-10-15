export type SourceKey =
  | "Human"
  | "No-Flat"
  | "Joint"
  | "SchemaLeaks"
  | "Predict"
  | "Rate"
  | "Claude"
  | "DeepSeek"
  | "Jev"
  | "Numeric";

/** Colour follows the entity: every Claude condition is Claude orange. */
export const COLOR: Record<SourceKey, string> = {
  Human: "var(--human)",
  "No-Flat": "var(--noflat)",
  Joint: "var(--claude)",
  SchemaLeaks: "var(--claude)",
  Predict: "var(--claude)",
  Rate: "var(--claude)",
  Claude: "var(--claude)",
  DeepSeek: "var(--deepseek)",
  Jev: "var(--jev)",
  Numeric: "var(--numeric)",
};

export const ASPECT_LABEL: Record<string, string> = {
  cleanliness: "Cleanliness",
  facilities: "Facilities",
  security: "Security",
  staff: "Staff",
  atmosphere: "Atmosphere",
  location: "Location",
  value_for_money: "Value",
  overall: "Overall",
};

export const fmt = (v: number | null | undefined, d = 2) =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(d);

export const EASE = [0.22, 1, 0.36, 1] as const;
