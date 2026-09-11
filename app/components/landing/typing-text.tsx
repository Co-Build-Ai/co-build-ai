"use client";

import { useEffect, useRef, useState } from "react";

type Tag = "p" | "span" | "h2" | "h3";

export default function TypingText({
  text,
  as = "p",
  className = "",
  speed = 30,
  startDelay = 0,
}: {
  text: string;
  as?: Tag;
  className?: string;
  speed?: number;
  startDelay?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const raf = requestAnimationFrame(() => setCount(text.length));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            observer.unobserve(entry.target);
            const delayTimer = window.setTimeout(() => {
              let i = 0;
              const interval = window.setInterval(() => {
                i += 1;
                setCount(i);
                if (i >= text.length) window.clearInterval(interval);
              }, speed);
            }, startDelay);
            return () => window.clearTimeout(delayTimer);
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, speed, startDelay]);

  const done = count >= text.length;
  const Tag = as;

  return (
    <Tag ref={ref as never} className={className}>
      {text.slice(0, count)}
      <span className={`typing-caret ${done ? "is-done" : ""}`} aria-hidden="true" />
    </Tag>
  );
}
