export default function HeroSection() {
  return (
    <section className="flex flex-col items-center px-6 pt-20 pb-16 text-center sm:px-12 sm:pt-28">
      <span className="rounded-full bg-white px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-coral shadow-sm">
        Fikrinden ürüne, AI ile
      </span>

      <h1 className="mt-6 font-[family-name:var(--font-fraunces)] text-5xl font-semibold tracking-tight text-ink sm:text-7xl">
        CO-BUILD AI
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
        Fikir sahipleri ile yazılımcıları{" "}
        <span className="font-semibold text-ink">Agentic RAG</span> ve{" "}
        <span className="font-semibold text-ink">Semantik Arama</span> teknolojileriyle
        buluşturan, %100 gizlilik odaklı derin öğrenme kuluçka merkezi.
      </p>
    </section>
  );
}
