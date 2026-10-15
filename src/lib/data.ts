import raw from "@/data/site.json";

type Row = Record<string, number | string | null>;

export interface SiteData {
  meta: {
    aspects: string[];
    cities: string[];
    sevenCities: string[];
    properties: number;
    scrapedProperties: number;
    scrapedCities: number;
  };
  hero: {
    hostels: { label: string; city: string; reviews: number; flatShare: number; human: number[]; noflat: number[]; claude: number[]; deepseek: number[]; jev: number[] }[];
    median: { hmean: number; hrange: number; crange: number };
    n: number;
  };
  flat: {
    corpus: {
      reviews: number; users: number; flatPct: number; flatTopPct: number; flatBottomPct: number;
      pFlatAfterFlat: number; pFlatAfterNonFlat: number; textFlat: number; textNonFlat: number;
      experience: { bucket: string; flat: number; n: number }[];
    };
    sample: {
      reviews: number; flatPct: number;
      distinct: { k: number; pct: number }[];
      flatValues: { score: number; pct: number }[];
      shift: { aspect: string; all: number; noflat: number }[];
      lowShareAll: number; lowShareNoFlat: number;
    };
  };
  ch4: {
    halo: Row[];
    aiicByCity: Row[];
    ablation: Row[];
    scatter: { city: string; h: number; p: number; j: number | null; d: number | null }[];
    perAspect: Row[];
    perAspectMatched: Row[];
    matrices: Record<string, Record<string, number[][] | null>>;
    deltas: Record<string, Record<string, { nf: number[][]; m: number[][]; cos: number; ratio: number; n: number }>>;
    selective: Row[];
    selectiveMatched: Row[];
    profile: Row[];
    profileMatched: Row[];
    profileExample: { hotel: number; human: number[]; noflat: number[]; predict: number[]; jev: number[]; deepseek: number[] | null };
    dsCities: string[];
  };
  jevDiag: { validity: Row[] };
  ch5: {
    matchedCities: string[];
    sd: Row[];
    sdCity: Row[];
    jevNoiseByAspect: Record<string, number>;
    jevIdenticalReruns: number;
    nulls: { group: string; joint: number; predict: number }[];
    schemaCompliance: { model: string; firstPass: number }[];
    cost: { label: string; model: string; cents: number }[];
    cache: { label: string; model: string; pct: number }[];
    claudePredictNoCacheCents: number;
    jevTotals: { calls: number; failed: number; costUSD: number; inputTokens: number };
  };
  ch6: { headline: Row[]; byAspect: Row[] };
  ch7: { digits: Row[]; resolution: Row[]; ties: Row[] };
  within: { reviews: number; hostels: number; rAll: number; rNonFlat: number; buckets: { clean: string; locDev: number; n: number }[] };
  jevAnatomy: {
    hotel: number;
    aspects: Record<string, { score: number; p: number[]; confidence: number }>;
  };
}

export const data = raw as unknown as SiteData;

export const num = (r: Row, k: string) => (r[k] == null ? NaN : Number(r[k]));
