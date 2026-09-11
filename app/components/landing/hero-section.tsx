import TypingText from "./typing-text";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center px-6 pt-32 pb-16 text-center sm:px-12 sm:pt-40">
      <TypingText
        as="span"
        text="Fikrinden ürüne, AI ile"
        className="reveal w-fit font-mono text-[11px] font-semibold uppercase tracking-widest text-white"
        speed={42}
      />

      <h1 className="reveal mt-6 font-[family-name:var(--font-clash-display)] text-6xl font-bold tracking-tight text-white sm:text-8xl lg:text-9xl">
        Co-Build AI
      </h1>

      <TypingText
        as="p"
        text="Fikir sahipleri ile yazılımcıları Agentic RAG ve Semantik Arama teknolojileriyle buluşturan, %100 gizlilik odaklı derin öğrenme kuluçka merkezi."
        className="reveal mt-6 max-w-2xl text-lg leading-relaxed text-white sm:text-xl"
        speed={24}
        startDelay={300}
      />
    </section>
  );
}
