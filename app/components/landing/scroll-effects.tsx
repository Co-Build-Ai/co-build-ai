"use client";

import { useEffect, useRef } from "react";

export default function ScrollEffects() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reveal animasyonu: .reveal sınıflı elemanlar ekrana girince görünür olur
    const revealEls = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));

    // Gerçek sonsuz döngü: içerik (main+footer) iki kez render ediliyor
    // (bkz. page.tsx, #loop-copy-0 / #loop-copy-1). Kullanıcı ilk kopyanın
    // sonuna gelince, scroll pozisyonundan sessizce bir kopya yüksekliği
    // düşülüyor — ikinci kopya birebir aynı olduğu için görsel olarak hiçbir
    // sıçrama/animasyon hissedilmiyor, sonsuz kayan bir şerit gibi davranıyor.
    const firstCopy = document.getElementById("loop-copy-0");
    let copyHeight = 0;

    function measure() {
      copyHeight = firstCopy?.getBoundingClientRect().height ?? 0;
    }
    measure();

    const resizeObserver = firstCopy ? new ResizeObserver(measure) : null;
    if (firstCopy && resizeObserver) resizeObserver.observe(firstCopy);
    // Fontlar/görseller yerleşene kadar birkaç kez yeniden ölç
    const remeasureTimers = [100, 500, 1200].map((ms) => window.setTimeout(measure, ms));

    function updateProgressBar(scrollTop: number) {
      const progress = copyHeight > 0 ? (scrollTop % copyHeight) / copyHeight : 0;
      if (barRef.current) {
        barRef.current.style.width = `${progress * 100}%`;
      }
    }

    function handleScroll() {
      const scrollTop = window.scrollY;
      if (copyHeight > window.innerHeight * 1.5 && scrollTop >= copyHeight) {
        window.scrollTo(0, scrollTop - copyHeight);
        return;
      }
      updateProgressBar(scrollTop);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    const raf = requestAnimationFrame(() => updateProgressBar(window.scrollY));

    return () => {
      observer.disconnect();
      resizeObserver?.disconnect();
      remeasureTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-white/10">
      <div
        ref={barRef}
        className="h-full w-0 bg-gradient-to-r from-[#cc0621] via-[#5f06cc] to-[#063ecc] transition-[width] duration-150 ease-out"
      />
    </div>
  );
}
