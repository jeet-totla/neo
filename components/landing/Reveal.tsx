"use client";

import { useEffect, useRef, useState } from "react";

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: {
  children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} data-on={on} style={{ ["--d" as string]: `${delay}ms` }} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
