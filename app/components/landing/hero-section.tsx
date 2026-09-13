import TypingText from "./typing-text";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center px-6 pt-32 pb-16 text-center sm:px-12 sm:pt-40">
      <TypingText
        as="span"
        text="Fikrinden ürüne, AI ile"
        className="reveal w-fit rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-[#44ACFF] shadow-sm"
        speed={42}
      />

      <h1 className="reveal mt-6 font-[family-name:var(--font-bagel)] text-6xl font-normal tracking-tight text-slate-800 sm:text-7xl lg:text-8xl">
        Co-Build{" "}
        <span className="bg-gradient-to-r from-[#FE9EC7] to-[#44ACFF] bg-clip-text text-transparent">
          AI
        </span>
      </h1>

      <TypingText
        as="p"
        text="Fikir sahipleri ile yazılımcıları Agentic RAG ve Semantik Arama teknolojileriyle buluşturan, %100 gizlilik odaklı derin öğrenme kuluçka merkezi."
        className="reveal mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl"
        speed={24}
        startDelay={300}
      />
    </section>
  );
}
