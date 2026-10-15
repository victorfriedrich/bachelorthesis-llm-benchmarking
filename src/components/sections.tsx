"use client";

import { useState } from "react";
import { data, num } from "@/lib/data";
import { ASPECT_LABEL, COLOR, fmt } from "@/lib/tokens";
import { Chapter, ClientOnly, Figure, Legend, Reveal, Segmented } from "./ui";
import { CorrLegend, DigitStrips, DotRows, GroupedBars, HBars, Heatmap, Ladder, Lines, Scatter, Series, useCorrColors } from "./charts";
import { Fade, JevAnatomy, NoiseExplainer, ProfileExplainer } from "./explainers";
import { DistinctChart, FlatDefinition, SKEW, ShiftChart, SkewChart } from "./flat";
import { Checklist, Framing, Pipeline } from "./method";
import { AngleDial, DIR_MODELS, DeltaPair, DirModel } from "./direction";
import { CONDITIONS, NormalizedAIIC, PromptAnatomy } from "./ablation";
import { Scorecard, scorecardTable, useScorecardRows } from "./scorecard";
import { HostelCompare } from "./hero";

const A = data.meta.aspects;
const DS = data.ch4.dsCities;
const CLAUDE: Series = { key: "Predict", label: "Claude", color: COLOR.Claude };
const DEEPSEEK: Series = { key: "DeepSeek", label: "DeepSeek", color: COLOR.DeepSeek };
const JEV: Series = { key: "Jev", label: "Jev", color: COLOR.Jev };
const HUMAN: Series = { key: "Human", label: "All guests", color: COLOR.Human };
const NOFLAT: Series = { key: "No-Flat", label: "Without flat reviews", color: COLOR["No-Flat"] };
const MODELS3 = [CLAUDE, DEEPSEEK, JEV];
const modelLegend = <Legend items={[{ label: "Claude", color: COLOR.Claude }, { label: `DeepSeek · ${DS.length} cities`, color: COLOR.DeepSeek }, { label: "Jev", color: COLOR.Jev }]} />;

const mean = (xs: number[]) => {
  const v = xs.filter(Number.isFinite);
  return v.reduce((s, x) => s + x, 0) / v.length;
};

/* ─── 01 · The problem ─────────────────────────────────────────────────────── */

const INTRO_CITY = "Budapest"; // matrix example: a different city from the hero's Barcelona
const SKEW_CITY = "Barcelona";
const SKEW_SHOW = ["Canggu", "Bangkok", "Ubud", "Budapest", "Lisbon", "Barcelona", "Prague"]; // chart cities (the table lists all 18)

export function Problem() {
  const f = data.flat;
  const flatPct = f.sample.distinct.find((d) => d.k === 1)?.pct ?? NaN;
  const halo = data.ch4.halo;
  const colors = useCorrColors();
  const labels = A.map((a) => ASPECT_LABEL[a]);
  const intro = {
    human: data.ch4.matrices[INTRO_CITY]?.Human ?? null,
    noflat: data.ch4.matrices[INTRO_CITY]?.["No-Flat"] ?? null,
    n: halo.find((r) => r.City === INTRO_CITY)?.["n hotels"] ?? "",
  };
  const skew = SKEW.filter((r) => SKEW_SHOW.includes(r.city));
  const rows = [...halo].sort((a, b) => num(b, "AIIC") - num(a, "AIIC"))
    .map((r) => ({ label: String(r.City), values: { Human: num(r, "AIIC"), "No-Flat": num(r, "No-Flat AIIC") } }));
  return (
    <Chapter id="problem" n="01" eyebrow="The problem" title={<>Guests must rate all seven aspects,<br />and many give them all the same score.</>}
      lede="Hostelworld asks for seven aspect scores before a guest can write a review. Many guests give every aspect the same number, and even the best hostels end up separated by tenths of a point.">
      <Figure title="The five best-rated hostels in a city differ by tenths of a point" note="Each dot is one of a city's five best-rated hostels, on Hostelworld's 2–10 scale."
        table={{ columns: ["City", "Hostels", "Best", "5th best", "Spread"], rows: SKEW.map((r) => [r.city, r.n, r.best, r.last, r.span]) }}>
        <SkewChart rows={skew} highlight={SKEW_CITY} />
      </Figure>
      <Reveal className="card grid gap-10 p-7 sm:p-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
        <div>
          <div className="eyebrow mb-3">The halo effect</div>
          <p className="text-[17px] leading-relaxed">
            A guest&apos;s overall feeling about a stay tends to set all seven scores at once. A fun bar or friendly staff can turn into a 10 for cleanliness and security as well.
          </p>
          <div className="mt-8 flex items-baseline gap-4">
            <div className="display num text-[56px]">{Math.round(flatPct)}%</div>
            <p className="text-[13px] leading-snug" style={{ color: "var(--ink-2)" }}>of reviews give all seven aspects the same score. We call these <b style={{ color: "var(--ink)" }}>flat reviews</b>.</p>
          </div>
        </div>
        <FlatDefinition />
      </Reveal>
      <Figure title="How many different scores one review uses" note={`Out of seven aspect scores, how many different values a review contains. 1 = a flat review. ${f.sample.reviews.toLocaleString("en-US")} reviews from the 18 cities.`}
        table={{ columns: ["Different scores", "% of reviews"], rows: f.sample.distinct.map((d) => [d.k, d.pct]) }}>
        <DistinctChart />
      </Figure>
      <Reveal className="card grid gap-6 p-7 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:p-10">
        <div>
          <div className="eyebrow mb-3">The assumption</div>
          <p className="text-[22px] font-light leading-snug sm:text-[26px]">
            A guest who really judged seven different things would rarely give all seven the same score. A flat review also says nothing about which aspect was better, so flat reviews are set aside.
          </p>
        </div>
        <div className="grid content-center gap-4 text-[14px]" style={{ color: "var(--ink-2)" }}>
          <p>The remaining <b style={{ color: "var(--ink)" }}>non-flat reviews</b> serve as the comparison point for the rest of this site.</p>
          <p>They still carry some halo, so they do not give the true scores. They show which way the scores move when guests rate more carefully.</p>
        </div>
      </Reveal>
      <Figure title="Removing flat reviews lowers every average" note={`Average score per aspect on Hostelworld's 2–10 scale. The share of reviews rating the stay below 7 rises from ${f.sample.lowShareAll.toFixed(0)}% to ${f.sample.lowShareNoFlat.toFixed(0)}%.`}
        legend={<Legend items={[HUMAN, NOFLAT]} />}
        table={{ columns: ["Aspect", "All reviews", "Without flat reviews"], rows: f.sample.shift.map((s) => [ASPECT_LABEL[s.aspect], s.all, s.noflat]) }}>
        <ShiftChart />
      </Figure>
      <Figure title="Aspects that should differ rise and fall together"
        note={`Each cell compares two aspects across the ${intro.n} hostels of ${INTRO_CITY}. Dark red: hostels that score high on one aspect also score high on the other. The average over all 21 pairs is the AIIC (average inter-item correlation): one number for how much the aspects move together.`}
        legend={<CorrLegend colors={colors} />}>
        <div className="grid justify-items-center gap-8 sm:grid-cols-2">
          <Heatmap matrix={intro.human} labels={labels} title="All guests" colors={colors} cell={38} />
          <Heatmap matrix={intro.noflat} labels={labels} title="Without flat reviews" colors={colors} cell={38} />
        </div>
      </Figure>
      <Figure title="Without flat reviews, the aspects move together less, but still strongly"
        note="AIIC per city. 1 = the seven aspects always rise and fall together, 0 = they are unrelated."
        legend={<Legend items={[HUMAN, NOFLAT]} />}
        table={{ columns: ["City", "Hostels", "Flat reviews %", "AIIC", "Without flat reviews"], rows: halo.map((r) => [r.City, r["n hotels"], num(r, "Flat-liner %"), num(r, "AIIC"), num(r, "No-Flat AIIC")]) }}>
        <DotRows rows={rows} series={[HUMAN, NOFLAT]} domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} valueCols={["Human", "No-Flat"]} labelW={96} />
      </Figure>
    </Chapter>
  );
}

/* ─── 02 · Method ───────────────────────────────────────────────────────────── */

export function Method() {
  return (
    <Chapter id="method" n="02" eyebrow="Method" title={<>Guest ratings and model scores,<br />tested side by side.</>}
      lede="If guests’ ratings carry a halo, a model that copies them looks accurate for the wrong reason. So the guests’ ratings are not treated as the right answer. Guest ratings and model scores are both treated as measurements that can be wrong, and both go through the same checks.">
      <Figure title="Two ways to judge a model's scores"><Framing /></Figure>
      <Figure title="The checklist" note="Standard checks for any measurement. Each links to the chapter that answers it."><Checklist /></Figure>
      <Figure title="Pipeline" note="Models and guests score exactly the same reviews."><Pipeline /></Figure>
      <Figure title="How Jev answers" note="Jev writes no text. For each aspect it gives a probability for each of ten rating levels (bars). Its score is the average level, weighted by those probabilities (dot). Example: one hostel in Florence.">
        <JevAnatomy aspects={data.jevAnatomy.aspects} />
      </Figure>
    </Chapter>
  );
}

/* ─── 03 · Convergent validity ─────────────────────────────────────────────── */

export function Agreement() {
  const [model, setModel] = useState<"Claude" | "DeepSeek" | "Jev">("Claude");
  const [cal, setCal] = useState<"raw" | "calibrated">("raw");
  const key = model === "Claude" ? "p" : model === "Jev" ? "j" : "d";
  const pts = data.ch4.scatter.filter((p) => p[key] != null).map((p) => ({ x: p[key] as number, y: p.h, label: p.city }));
  const per = data.ch4.perAspect;
  const rows = per.map((r) => ({ label: String(r.Aspect).replace("Value for money", "Value"), values: { Predict: num(r, "Predict mean r"), DeepSeek: num(r, "DeepSeek mean r"), Jev: num(r, "Jev mean r") } }));
  return (
    <Chapter id="agreement" n="03" eyebrow="Convergent validity" title={<>Models rank hostels like guests do,<br />but score them lower.</>}
      lede="All three models put hostels in almost the same order as guests, but give lower scores. A simple straight-line conversion fixes the level (switch to Calibrated).">
      <Reveal className="card p-5 sm:p-7"><HostelCompare /></Reveal>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6">
        <Figure title="Overall score, model vs guests" note={`${pts.length} hostels`}
          controls={<div className="flex flex-wrap gap-2">
            <Segmented label="model" options={["Claude", "DeepSeek", "Jev"] as const} value={model} onChange={setModel} />
            <Segmented label="calibration" options={[{ value: "raw", label: "Raw" }, { value: "calibrated", label: "Calibrated" }]} value={cal} onChange={setCal} />
          </div>}
          table={{ columns: ["City", "Guests", "Claude", "DeepSeek", "Jev"], rows: data.ch4.scatter.map((p) => [p.city, p.h, p.p, p.d, p.j]) }}>
          <Scatter points={pts} color={model === "Jev" ? COLOR.Jev : model === "DeepSeek" ? COLOR.DeepSeek : COLOR.Claude} calibrated={cal === "calibrated"} xLabel={`${model} score`} yLabel="Guests' score" />
        </Figure>
        <Figure title="Agreement with guests, per aspect" note="Correlation between model and guest scores across hostels (1 = same ranking). Average over cities." legend={modelLegend}
          table={{ columns: ["Aspect", "Claude r", "DeepSeek r", "Jev r"], rows: per.map((r) => [r.Aspect, num(r, "Predict mean r"), num(r, "DeepSeek mean r"), num(r, "Jev mean r")]) }}>
          <DotRows rows={rows} series={MODELS3} domain={[0.5, 1]} ticks={[0.5, 0.75, 1]} valueCols={["Predict", "DeepSeek", "Jev"]} labelW={92} />
        </Figure>
      </div>
    </Chapter>
  );
}

/* ─── 04 · Discriminant validity ───────────────────────────────────────────── */

export function Structure() {
  const [city, setCity] = useState("Florence");
  const colors = useCorrColors();
  const m = data.ch4.matrices[city];
  const labels = A.map((a) => ASPECT_LABEL[a]);
  const sources = [
    { key: "Human", title: "All guests" },
    { key: "No-Flat", title: "Without flat reviews" },
    { key: "Predict", title: "Claude" },
    { key: "DeepSeek", title: "DeepSeek" },
    { key: "Jev", title: "Jev" },
  ];
  const sel = data.ch4.selective;
  const groups = ["Physical", "Subjective", "Location"];
  const series: Series[] = [HUMAN, NOFLAT, ...MODELS3];
  const values = Object.fromEntries(groups.map((g) => [g, Object.fromEntries(series.map((s) => {
    const r = sel.find((x) => x.Source === s.key);
    return [s.key, r ? num(r, g) : null];
  }))]));
  return (
    <Chapter id="structure" n="04" eyebrow="Discriminant validity" title={<>Models separate location most,<br />and keep related aspects linked.</>}
      lede="In the model scores, the aspects are much less alike overall, but not evenly. Aspects that plausibly belong together, like cleanliness and facilities, still move together. Location separates from everything else.">
      <Figure title={`Correlation between aspects · ${city}`}
        controls={<select value={city} onChange={(e) => setCity(e.target.value)} aria-label="city"
          className="rounded-full px-3 py-[6px] text-[12px]" style={{ background: "var(--wash)", border: "1px solid var(--hair)", color: "var(--ink)" }}>
          {data.meta.cities.map((c) => <option key={c} value={c}>{c}{DS.includes(c) ? "" : " (no DeepSeek)"}</option>)}
        </select>}
        legend={<CorrLegend colors={colors} />}
        table={{ columns: ["Source", ...labels], rows: sources.flatMap((s) => (m[s.key] ?? []).map((row, i) => [`${s.title} · ${labels[i]}`, ...row])) }}>
        <Fade k={city}>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
            {sources.map((s) => m[s.key]
              ? <Heatmap key={s.key} matrix={m[s.key] ?? null} labels={labels} title={s.title} colors={colors} cell={30} />
              : <div key={s.key} className="grid place-items-center p-4 text-center text-[12px]" style={{ color: "var(--muted)" }}>{s.title}<br />not run for {city}</div>)}
          </div>
        </Fade>
      </Figure>
      <Figure title="How strongly related aspects move together"
        note={`Average correlation within three groups. Physical: cleanliness, facilities, security. Subjective: staff, atmosphere, value. Location: location paired with each other aspect. DeepSeek covers ${DS.length} cities.`}
        legend={<Legend items={series.map((s) => ({ label: s.label, color: s.color, mark: "rect" as const }))} />}
        table={{ columns: ["Cluster", ...series.map((s) => s.label)], rows: groups.map((g) => [g, ...series.map((s) => values[g][s.key])]) }}>
        <GroupedBars groups={groups} series={series} values={values} domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} />
      </Figure>
    </Chapter>
  );
}

/* ─── 05 · Structural validity: direction ──────────────────────────────────── */

export function Direction() {
  const [city, setCity] = useState("All cities");
  const [model, setModel] = useState<DirModel>("Predict");
  const rows = data.meta.cities.map((c) => ({
    label: c,
    values: Object.fromEntries(DIR_MODELS.map((m) => [m.key, data.ch4.deltas[c]?.[m.key]?.cos ?? null])),
  }));
  return (
    <Chapter id="direction" n="05" eyebrow="Structural validity" title={<>Models change the scores the same way<br />removing flat reviews does.</>}
      lede="Removing flat reviews changes how strongly each pair of aspects moves together. Scoring from the text changes it too. If both changes hit the same pairs, the model is removing halo, not just adding random noise.">
      <Reveal className="flex flex-wrap items-center gap-2">
        <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="city"
          className="rounded-full px-3 py-[6px] text-[12px]" style={{ background: "var(--surface)", border: "1px solid var(--hair)", color: "var(--ink)" }}>
          <option>All cities</option>
          {data.meta.cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Segmented label="model" value={model} onChange={setModel} options={DIR_MODELS.map((m) => ({ value: m.key, label: m.label }))} />
      </Reveal>
      <Figure title="Which aspect pairs change" note={`Change for each pair of aspects compared with all guests' ratings. Left: removing flat reviews. Right: the model. Matching colours in the same cells mean the same pattern. ${city === "All cities" ? "Average over all cities." : city + "."}`}>
        <Fade k={`${city}-${model}`}><DeltaPair city={city} model={model} /></Fade>
      </Figure>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
        <Figure title="The same comparison as arrows" note="Each arrow stands for all 21 pair changes at once. A small angle to the grey arrow means the same pattern as removing flat reviews. The × value compares the size of the change with removing flat reviews.">
          <AngleDial city={city} model={model} onPick={setModel} />
        </Figure>
        <Figure title="Pattern similarity by city" note="Cosine similarity: 1 = same pattern of changes, 0 = unrelated." legend={modelLegend}
          table={{ columns: ["City", "Claude", "DeepSeek", "Jev"], rows: rows.map((r) => [r.label, r.values.Predict, r.values.DeepSeek, r.values.Jev]) }}>
          <DotRows rows={rows} series={MODELS3} domain={[0.3, 1]} ticks={[0.4, 0.6, 0.8, 1]} rowH={28} labelW={84} />
        </Figure>
      </div>
    </Chapter>
  );
}

/* ─── 06 · Structural validity: profiles ───────────────────────────────────── */

export function Profiles() {
  const ex = data.ch4.profileExample;
  const p = data.ch4.profile;
  const cities = p.filter((r) => r.City !== "Mean");
  const avg = p.find((r) => r.City === "Mean")!;
  const rows = cities.map((r) => ({ label: String(r.City), values: { Predict: num(r, "Predict cos"), DeepSeek: num(r, "DeepSeek cos"), Jev: num(r, "Jev cos") } }));
  const lines = [
    { key: "h", label: "All guests", color: COLOR.Human, values: ex.human },
    { key: "n", label: "Without flat reviews", color: COLOR["No-Flat"], values: ex.noflat },
    { key: "p", label: "Claude", color: COLOR.Claude, values: ex.predict },
    ...(ex.deepseek ? [{ key: "d", label: "DeepSeek", color: COLOR.DeepSeek, values: ex.deepseek }] : []),
    { key: "j", label: "Jev", color: COLOR.Jev, values: ex.jev },
  ];
  return (
    <Chapter id="profiles" n="06" eyebrow="Within-hostel profiles" title={<>Models see each hostel&apos;s strengths<br />and weaknesses like non-flat reviews do.</>}
      lede="Subtract a hostel's average from its seven scores, and what remains shows its relative strengths and weaknesses. For about nine in ten hostels, each model's pattern is closer to the non-flat reviews than to all guests' ratings.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
        <Figure title="One hostel, five sets of scores" note="A hostel in Florence. Switch to Centred to remove each source's average level."
          legend={<Legend items={lines.map((l) => ({ label: l.label, color: l.color, mark: "line" as const }))} />}
          table={{ columns: ["Aspect", ...lines.map((l) => l.label)], rows: A.map((a, i) => [ASPECT_LABEL[a], ...lines.map((l) => l.values[i])]) }}>
          <ProfileExplainer series={lines} />
        </Figure>
        <Reveal className="card grid content-center gap-7 p-7">
          {MODELS3.map((s) => (
            <div key={s.key} className="flex items-end justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
                  <span className="h-[8px] w-[8px] rounded-full" style={{ background: s.color }} />{s.label}
                </div>
                <div className="display num text-[46px]">{Math.round(num(avg, `${s.key} Closer %`))}%</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>of hostels where the model&apos;s pattern is closer to the non-flat reviews</div>
              </div>
              <div className="text-right text-[12px]" style={{ color: "var(--muted)" }}>pattern match<div className="num text-[20px] font-light" style={{ color: "var(--ink)" }}>{fmt(num(avg, `${s.key} cos`))}</div></div>
            </div>
          ))}
        </Reveal>
      </div>
      <Figure title="Pattern match with the non-flat reviews, by city" note="Cosine similarity of the centred scores. 1 = same strengths and weaknesses." legend={modelLegend}
        table={{ columns: ["City", "Claude", "DeepSeek", "Jev"], rows: p.map((r) => [r.City, num(r, "Predict cos"), num(r, "DeepSeek cos"), num(r, "Jev cos")]) }}>
        <DotRows rows={rows} series={MODELS3} domain={[0.4, 1]} ticks={[0.4, 0.6, 0.8, 1]} valueCols={["Predict", "DeepSeek", "Jev"]} rowH={28} />
      </Figure>
    </Chapter>
  );
}

/* ─── 07 · Prompt design (RQ2) ─────────────────────────────────────────────── */

export function Prompt() {
  const byCity = data.ch4.aiicByCity;
  const split = data.ch4.ablation.find((r) => r.City === "Mean")!;
  const co = num(split, "Co-generation share"), sch = num(split, "Schema-awareness share");
  const src = [
    { key: "Human", label: "All guests", color: COLOR.Human, sub: "" },
    { key: "No-Flat", label: "Without flat reviews", color: COLOR["No-Flat"], sub: "" },
    ...CONDITIONS.map((c) => ({ key: c.key as string, label: c.key as string, color: c.color as string, sub: "Claude" })),
    { key: "DeepSeek-Joint", label: "Joint", color: COLOR.DeepSeek, sub: "DeepSeek" },
    { key: "DeepSeek-SchemeLeaks", label: "SchemaLeaks", color: COLOR.DeepSeek, sub: "DeepSeek" },
    { key: "DeepSeek", label: "Predict", color: COLOR.DeepSeek, sub: "DeepSeek" },
    { key: "Jev", label: "Jev", color: COLOR.Jev, sub: "aspects asked in parallel" },
  ];
  const ladder = src.map((s) => {
    const cities = byCity.filter((r) => Number.isFinite(num(r, s.key))).map((r) => ({ city: String(r.City), v: num(r, s.key) }));
    return { ...s, sub: `${s.sub ? s.sub + " · " : ""}${cities.length} cities`, mean: mean(cities.map((c) => c.v)), cities };
  });
  return (
    <Chapter id="prompt" n="07" eyebrow="Prompt and output format" title={<>The output format<br />changes the scores.</>}
      lede="Claude was asked for scores in four ways. Each step removes one thing that could make the aspect scores alike. Asking for all aspects in one answer was already known to do this. Listing all seven aspects in the output format turned out to do it too, even when each aspect is asked for separately.">
      <Figure title="What each condition sends"><PromptAnatomy /></Figure>
      <Reveal className="card grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" >
        <div>
          <div className="eyebrow mb-3" style={{ color: "var(--claude)" }}>New finding · not tested before</div>
          <p className="text-[24px] font-light leading-snug sm:text-[30px]">
            Even with one call per aspect, listing all seven aspects in the output format keeps the scores alike. Hiding the list accounts for <span className="num" style={{ color: "var(--claude)" }}>{Math.round(sch * 100)}%</span> of the improvement.
          </p>
        </div>
        <div className="grid content-center gap-4 text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          <p>Claude returned its scores by calling a tool. The tool&apos;s definition, including the list of aspects, is added to the system prompt. So the model sees every aspect being rated, even when it is asked about only one.</p>
          <p>Asking for all aspects in one answer is a known cause of this in LLM judges. The output format adds almost as much ({Math.round(sch * 100)}% against {Math.round(co * 100)}%), but it is usually treated as a formatting detail and not reported.</p>
          <p style={{ color: "var(--ink)" }}>For anyone using an LLM to score several criteria: report the output format along with the prompt, and don&apos;t show the model all criteria when each should be judged on its own.</p>
        </div>
      </Reveal>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
        <Figure title="Where each condition lands, city by city" note={`AIIC rescaled per city so that Predict = 0 and Joint = 1. SchemaLeaks lands near ${(1 - co).toFixed(1)}: the aspect list alone keeps that share of the overlap.`}
          legend={<Legend items={CONDITIONS.map((c) => ({ label: c.key, color: c.color }))} />}
          table={{ columns: ["City", ...CONDITIONS.map((c) => c.key)], rows: byCity.filter((r) => data.meta.sevenCities.includes(String(r.City))).map((r) => [r.City, ...CONDITIONS.map((c) => num(r, c.key))]) }}>
          <NormalizedAIIC />
        </Figure>
        <Reveal className="card grid content-center gap-6 p-7">
          <div className="eyebrow">What explains the drop from Joint to Predict</div>
          {[{ l: "Separate calls · known effect", v: co, c: "var(--c1)" }, { l: "Hiding the aspect list · new", v: sch, c: "var(--c2)" }].map((x) => (
            <div key={x.l}>
              <div className="display num text-[56px]">{Math.round(x.v * 100)}%</div>
              <div className="mb-2 text-[13px]" style={{ color: "var(--ink-2)" }}>{x.l}</div>
              <div className="h-[4px] rounded-full" style={{ background: "var(--hair)" }}><div className="h-full rounded-full" style={{ width: `${x.v * 100}%`, background: x.c }} /></div>
            </div>
          ))}
          <p className="text-[12px]" style={{ color: "var(--muted)" }}>Established on Claude only: DeepSeek&apos;s rerun noise is too large to repeat the split (chapter 08).</p>
        </Reveal>
      </div>
      <Figure title="How much the aspects move together, every source" note="AIIC. Large dot = average, faint dots = cities."
        table={{ columns: ["City", ...src.map((s) => `${s.sub ? s.sub + " " : ""}${s.label}`)], rows: byCity.map((r) => [r.City, ...src.map((s) => num(r, s.key))]) }}>
        <Ladder rows={ladder} />
      </Figure>
    </Chapter>
  );
}

/* ─── 08 · Reruns ──────────────────────────────────────────────────────────── */

export function Reruns() {
  const sd = data.ch5.sd;
  const get = (m: string) => sd.find((r) => r.Model === m)!;
  const models = [
    { key: "Claude", label: "Claude", color: COLOR.Claude },
    { key: "DeepSeek", label: "DeepSeek", color: COLOR.DeepSeek },
    { key: "Jev", label: "Jev", color: COLOR.Jev },
  ];
  const ratio = {
    "Between hostels ÷ between runs": Object.fromEntries(models.map((m) => [m.key, num(get(m.key), "Hotel/Noise")])),
    "Between prompt versions ÷ between runs": Object.fromEntries(models.map((m) => [m.key, num(get(m.key), "Variant/Noise")])),
  };
  const cost = data.ch5.cost;
  const hostelX = models.map((m) => num(get(m.key), "Hotel/Noise"));
  return (
    <Chapter id="reruns" n="08" eyebrow="Reliability" title={<>Repeated runs agree enough to compare hostels,<br />not DeepSeek&apos;s prompt versions.</>}
      lede={`Each hostel was scored three times with identical settings (${data.ch5.matchedCities.join(", ")}). For every model, the differences between hostels are ${Math.floor(Math.min(...hostelX))}–${Math.round(Math.max(...hostelX))} times larger than the differences between runs. The differences between prompt versions are larger than the run-to-run differences for Claude and Jev, but not for DeepSeek. That is why chapter 07 uses Claude.`}>
      <Figure title="Three runs per hostel" note="Each group of three dots is one hostel scored three times, drawn with the measured spread. Tight groups that sit far apart mean reliable scores."
        table={{ columns: ["Model", "Rerun SD", "Condition SD", "Hostel SD", "Hostel ÷ noise", "Condition ÷ noise"], rows: sd.map((r) => [r.Model, num(r, "Noise SD"), num(r, "Variant SD"), num(r, "Hotel SD"), num(r, "Hotel/Noise"), num(r, "Variant/Noise")]) }}>
        <ClientOnly height={240}>
          <NoiseExplainer models={models.map((m) => ({ ...m, noise: num(get(m.key), "Noise SD"), hotel: num(get(m.key), "Hotel SD"), ratio: num(get(m.key), "Hotel/Noise") }))} />
        </ClientOnly>
      </Figure>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <Figure title="Differences compared with run-to-run variation" note="How many times larger each difference is than the variation between identical runs. Below 1, it can't be told apart from chance. Jev's prompt versions: one call, one call per aspect, and a direct-rating prompt."
          legend={<Legend items={models.map((m) => ({ ...m, mark: "rect" as const }))} />}
          table={{ columns: ["Ratio", ...models.map((m) => m.label)], rows: Object.entries(ratio).map(([k, v]) => [k, ...models.map((m) => v[m.key])]) }}>
          <GroupedBars groups={Object.keys(ratio)} series={models} values={ratio} domain={[0, 55]} ticks={[0, 10, 20, 30, 40, 50]} format={(v) => v.toFixed(v < 10 ? 1 : 0)} />
        </Figure>
        <Figure title="Cost per hostel" note="US cents at listed OpenRouter prices."
          table={{ columns: ["Pipeline", "¢ per hostel"], rows: cost.map((c) => [c.label, c.cents]) }}>
          <HBars rows={cost.map((c) => ({ label: c.label, value: c.cents, color: COLOR[c.model as "Claude"] }))} domain={[0, 14]} format={(v) => `${v < 1 ? v.toFixed(2) : v.toFixed(1)}¢`} />
        </Figure>
      </div>
    </Chapter>
  );
}

/* ─── 09 · Sampling reliability ────────────────────────────────────────────── */

export function Evidence() {
  const h = data.ch6.headline;
  const xs = h.map((r) => num(r, "chars"));
  const xl = ["1.25k", "2k", "5k", "10k"];
  const ser = (col: string) => h.map((r) => (Number.isFinite(num(r, col)) ? num(r, col) : null));
  const series = [
    { key: "num", label: "Guests' average", color: COLOR.Numeric, values: ser("mean_r_numeric") },
    { key: "claude", label: "Claude", color: COLOR.Claude, values: ser("mean_r_llm") },
    { key: "jev", label: "Jev", color: COLOR.Jev, values: ser("mean_r_jev") },
  ];
  const asp = data.ch6.byAspect;
  return (
    <Chapter id="evidence" n="09" eyebrow="Reliability with fewer reviews" title={<>With few reviews, the guests&apos;<br />ratings hold up better.</>}
      lede="Each hostel was scored again from random samples of its reviews, from about 5 to 43 reviews (1,250 to 10,000 characters). Each result is compared with the score from all reviews. At every sample size, the guests' average stays closer than the models do. The gap is largest for security and value, which reviews rarely mention directly. 165 hostels in nine cities; DeepSeek was not tested.">
      <Figure title="Agreement with the score from all reviews"
        note="Correlation between scores from a sample and scores from all reviews (1 = same ranking of hostels), by characters of review text. Average over seven aspects and seven random samples per size."
        legend={<Legend items={series.map((s) => ({ label: s.label, color: s.color, mark: "line" as const }))} />}
        table={{ columns: ["Characters", "Numeric r", "Claude r", "Jev r", "Numeric MAE", "Claude MAE", "Jev MAE"], rows: h.map((r) => [r.chars, num(r, "mean_r_numeric"), num(r, "mean_r_llm"), num(r, "mean_r_jev"), num(r, "mean_mae_numeric"), num(r, "mean_mae_llm"), num(r, "mean_mae_jev")]) }}>
        <Lines xs={xs} xLabels={xl} series={series} domain={[0.5, 1]} ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]} />
      </Figure>
      <Figure title="By aspect" note="Security and value lag most: reviews rarely mention them directly."
        legend={<Legend items={series.map((s) => ({ label: s.label, color: s.color, mark: "line" as const }))} />}
        table={{ columns: ["Budget", "Aspect", "Numeric r", "Claude r", "Jev r"], rows: asp.map((r) => [r.budget, ASPECT_LABEL[String(r.aspect)], num(r, "r_numeric"), num(r, "r_llm"), num(r, "r_jev")]) }}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-4">
          {A.map((a) => {
            const rows = xs.map((x) => asp.find((r) => r.aspect === a && num(r, "chars") === x)!);
            const s = [
              { ...series[0], values: rows.map((r) => num(r, "r_numeric")) },
              { ...series[1], values: rows.map((r) => num(r, "r_llm")) },
              { ...series[2], values: rows.map((r) => (Number.isFinite(num(r, "r_jev")) ? num(r, "r_jev") : null)) },
            ];
            return <Lines key={a} compact title={ASPECT_LABEL[a]} xs={xs} xLabels={xl} series={s} domain={[0.4, 1]} ticks={[0.4, 0.7, 1]} height={150} />;
          })}
        </div>
      </Figure>
    </Chapter>
  );
}

/* ─── 10 · Resolution ──────────────────────────────────────────────────────── */

export function Resolution() {
  const dg = data.ch7.digits;
  const order = ["Claude-Joint", "Claude-Predict", "Claude-SchemeLeaks", "DeepSeek-Joint", "DeepSeek-Predict", "DeepSeek-SchemeLeaks", "Human-Rating Mean", "Jev"];
  const nice = (s: string) => s.replace("SchemeLeaks", "SchemaLeaks").replace("Human-Rating Mean", "Guests' mean").replace("-", " · ");
  const colorOf = (m: string) => (m === "Human" ? COLOR.Human : COLOR[m as "Claude"]);
  const strips = order.map((s) => dg.find((r) => r.source === s)).filter(Boolean).map((r) => ({
    label: nice(String(r!.source)), group: String(r!.model), color: colorOf(String(r!.model)),
    p: Array.from({ length: 10 }, (_, d) => num(r!, `digit_${d}`)), h: num(r!, "H_last"),
  }));
  return (
    <Chapter id="resolution" n="10" eyebrow="Precision" title={<>Two decimals, but the models<br />favour a few last digits.</>}
      lede="Claude prefers to end its scores in 2, 5 or 8, and DeepSeek in 0 or 5. So a score like 0.83 is less precise than it looks. Jev’s score is the probability-weighted average of ten rating levels, so it has no favourite digits.">
      <Figure title="How often each last digit appears" note="Share of scores ending in each digit (the second decimal). Digits used: how many of the ten the scores effectively spread over (2 to the power of the entropy); 10 means all equally."
        table={{ columns: ["Source", ...Array.from({ length: 10 }, (_, d) => `${d}`), "Digits used"], rows: strips.map((s) => [s.label, ...s.p, 2 ** s.h]) }}>
        <DigitStrips rows={strips} />
      </Figure>
      <Reveal className="card grid gap-4 p-6 text-[14px] leading-relaxed sm:p-8" >
        <div className="eyebrow">Why the guests&apos; average and Jev look so precise</div>
        <p style={{ color: "var(--ink-2)" }}>
          Their last digits are spread evenly mostly because of how the scores are calculated. It does not mean they read the text more finely.
        </p>
        <ul className="grid gap-2 pl-5" style={{ color: "var(--ink-2)", listStyle: "disc" }}>
          <li><b style={{ color: "var(--ink)" }}>Claude and DeepSeek</b> write out one number per hostel, using the digits they like.</li>
          <li><b style={{ color: "var(--ink)" }}>The guests&apos; score</b> is the average of hundreds of whole-number ratings. Averaging that many numbers spreads the last digit evenly on its own.</li>
          <li><b style={{ color: "var(--ink)" }}>Jev&apos;s score</b> is the probability-weighted average of ten rating levels, so any value is possible.</li>
        </ul>
        <p style={{ color: "var(--ink-2)" }}>
          So this chart compares how scores are produced more than how well the text is read. Averaging several Claude runs would also even out its digits. And an even last digit says nothing about accuracy: a precise-looking score can still vary between runs (chapters 03 and 08).
        </p>
      </Reveal>
    </Chapter>
  );
}

/* ─── 11 · Scorecard ───────────────────────────────────────────────────────── */

export function Verdict() {
  const rows = useScorecardRows(false);
  return (
    <Chapter id="scorecard" n="11" eyebrow="Summary" title={<>Better than guest ratings at separating aspects,<br />with enough reviews and a careful output format.</>}
      lede="Claude is the most reliable reference. DeepSeek is cheaper but varies more between runs. Jev is the cheapest and most stable and keeps aspects most apart, partly because it reads atmosphere and value differently from guests.">
      <Figure title="Measurement checklist" table={scorecardTable(rows)}><Scorecard /></Figure>
    </Chapter>
  );
}
