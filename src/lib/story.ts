
/** Nav entries and the hero findings' links. */
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
