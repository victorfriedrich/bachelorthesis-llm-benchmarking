import { ImageResponse } from "next/og";
import { interpolateLab } from "d3-interpolate";
import { data } from "@/lib/data";

/* Link preview: the headline next to the guests' matrix and Claude's matrix, both averaged over the
   seven cities that ran every condition (the same numbers as the hero's step 1 and step 5). */

export const alt = "Testing an LLM judge when the human labels are biased. Correlation between hostel aspects: guests 0.78, Claude 0.36.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = data.meta.sevenCities;
const color = (v: number) => {
  const t = Math.max(-1, Math.min(1, v));
  return t < 0 ? interpolateLab("#efeee9", "#256abf")(-t) : interpolateLab("#efeee9", "#c43f3e")(t);
};

function meanMatrix(key: string) {
  const ms = C.map((c) => data.ch4.matrices[c]?.[key]).filter((m): m is number[][] => !!m);
  return ms[0].map((row, i) => row.map((_, j) => ms.reduce((s, m) => s + m[i][j], 0) / ms.length));
}
const avg = (m: number[][]) => {
  let s = 0, n = 0;
  for (let i = 0; i < m.length; i++) for (let j = 0; j < i; j++) { s += m[i][j]; n++; }
  return s / n;
};

function Triangle({ m, title }: { m: number[][]; title: string }) {
  const cell = 38;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#52514e" }}>
        <span>{title}</span><span style={{ color: "#0b0b0b" }}>{avg(m).toFixed(2)}</span>
      </div>
      {m.slice(1).map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 4 }}>
          {row.slice(0, i + 1).map((v, j) => (
            <div key={j} style={{ width: cell, height: cell, borderRadius: 7, background: color(v) }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function OpengraphImage() {
  const guests = meanMatrix("Human");
  const claude = meanMatrix("Predict");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f5f1", padding: 64, gap: 56, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <div style={{ fontSize: 18, letterSpacing: 3, color: "#898781" }}>VICTOR FRIEDRICH · TU MUNICH</div>
          <div style={{ fontSize: 60, lineHeight: 1.05, color: "#0b0b0b", letterSpacing: -2 }}>Testing an LLM judge when the human labels are biased.</div>
          <div style={{ fontSize: 24, lineHeight: 1.4, color: "#52514e" }}>
            Guests let one feeling set all seven scores. Read from the text, the aspects come apart, and listing every aspect in the output schema undoes part of that.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", gap: 40 }}>
            <Triangle m={guests} title="Guests' ratings" />
            <Triangle m={claude} title="Claude, from text" />
          </div>
          <div style={{ fontSize: 16, color: "#898781" }}>How much hostel aspects move together · average of 7 cities</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
