"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { Fragment, useEffect, useState } from "react";
import { LINKS } from "@/lib/story";

export function Nav({ chapters }: { chapters: { id: string; label: string; act: string }[] }) {
  const [active, setActive] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    chapters.forEach((c) => { const el = document.getElementById(c.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [chapters]);

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    const dark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(dark ? "light" : "dark");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40" style={{ background: "color-mix(in oklab, var(--plane) 82%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      <div className="mx-auto flex h-[56px] max-w-[1160px] items-center justify-between px-4 sm:px-8">
        <a href="#top" className="whitespace-nowrap text-[13px] font-medium tracking-tight">LLM aspect ratings</a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="chapters">
          {chapters.map((c, i) => (
            <Fragment key={c.id}>
            {i > 0 && chapters[i - 1].act !== c.act && <span aria-hidden className="mx-1 h-[14px] w-px" style={{ background: "var(--hair)" }} />}
            <a title={/^I|V/.test(c.act) ? `Part ${c.act} · ${c.label}` : c.label} href={`#${c.id}`} className="whitespace-nowrap rounded-full px-[10px] py-1 text-[12px] transition-colors"
              style={{ color: active === c.id ? "var(--ink)" : "var(--muted)", background: active === c.id ? "var(--wash)" : "transparent" }}>
              <span className="num opacity-50 xl:mr-1">{String(i + 1).padStart(2, "0")}</span><span className="hidden xl:inline">{c.label}</span>
            </a>
            </Fragment>
          ))}
        </nav>
        <button onClick={toggle} aria-label="toggle theme" className="grid h-[30px] w-[30px] place-items-center rounded-full" style={{ border: "1px solid var(--hair)" }}>
          <span className="block h-[12px] w-[12px] rounded-full" style={{ background: "linear-gradient(90deg, var(--ink) 50%, transparent 50%)", border: "1px solid var(--ink)" }} />
        </button>
      </div>
      <motion.div className="h-px origin-left" style={{ scaleX: progress, background: "var(--ink)", opacity: 0.5 }} />
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1160px] px-4 pb-16 pt-16 sm:px-8 sm:pt-24">
      <div className="grid gap-10 border-t pt-10 sm:grid-cols-[minmax(0,1fr)_auto]" style={{ borderColor: "var(--hair)" }}>
        <div>
          <div className="text-[20px] font-light">Victor Friedrich</div>
          <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Bachelor&apos;s thesis in Informatics, TU Munich, 2026.
          </p>
        </div>
        <nav aria-label="links" className="flex flex-wrap content-start gap-x-6 gap-y-2 text-[14px] sm:justify-end">
          {LINKS.filter((l) => l.href).map((l) => (
            <a key={l.label} href={l.href} className="underline decoration-[var(--axis)] underline-offset-4 transition-colors hover:decoration-[var(--ink)]">{l.label}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
