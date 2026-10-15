/** The four parts of the argument; each opens with the question its chapters answer. */
export const ACTS = [
  { id: "act-1", n: "I", title: "Guest ratings carry a halo", question: "How much does one overall feeling shape all seven scores?", range: "01–02" },
  { id: "act-2", n: "II", title: "Do scores from the review text avoid it?", question: "Do models reading the reviews keep the aspects apart, in the places where they should differ?", range: "03–06" },
  { id: "act-3", n: "III", title: "Can the way we ask bring it back?", question: "Which choices in how the model is asked make the aspect scores alike again?", range: "07" },
  { id: "act-4", n: "IV", title: "Can you trust the number?", question: "How much do scores change between runs and with fewer reviews, and how precise are they?", range: "08–10" },
] as const;

/** Six-chapter version (/short): nav entries and the hero findings' links. */
export const SHORT_CHAPTERS = [
  { id: "agreement", label: "Separation", act: "" },
  { id: "reruns", label: "Limits", act: "" },
  { id: "resolution", label: "Precision", act: "" },
  { id: "cost", label: "Cost", act: "" },
  { id: "lessons", label: "Lessons", act: "" },
];

export const SHORT_LINKS = [
  { href: "#agreement", label: "Chapter 01" },
  { href: "#steps", label: "Steps 3–5 above · new finding" },
  { href: "#reruns", label: "Chapters 02–03" },
];

export const THESIS_PDF = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/victor-friedrich-bachelor-thesis.pdf`;

/** Footer links. Leave a URL empty to hide that link; fill in thesis PDF, repo and contact when ready. */
export const LINKS: { label: string; href: string }[] = [
  { label: "Thesis (PDF)", href: THESIS_PDF },
  { label: "Code", href: "" },
  { label: "LinkedIn", href: "" },
  { label: "Email", href: "" },
];
