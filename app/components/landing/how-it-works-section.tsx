import { PenLine, Sparkles, Users, Rocket } from "lucide-react";
import TypingText from "./typing-text";

const STEPS = [
  {
    icon: PenLine,
    title: "Fikrini Anlat",
    description: "Teknik terim kullanmadan, kendi cümlelerinle ne yapmak istediğini yaz.",
  },
  {
    icon: Sparkles,
    title: "AI Şartnameye Çevirsin",
    description: "Agentic RAG döngüsü, fikrini kendi kendini denetleyip düzelten bir teknik PRD'ye dönüştürür.",
  },
  {
    icon: Users,
    title: "Doğru Ekiple Eşleş",
    description: "Semantik arama, beceri setine ve projenin ihtiyacına göre en uygun yazılımcıları önerir.",
  },
  {
    icon: Rocket,
    title: "Birlikte İnşa Edin",
    description: "Teklif, sohbet ve ilerleme takibiyle projeyi platform üzerinden birlikte yürütün.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="px-6 py-20 sm:px-12">
      <div className="reveal mx-auto max-w-2xl text-center">
        <span className="w-fit text-sm font-semibold uppercase tracking-widest text-[#44ACFF]">
          Süreç
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-jakarta)] text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
          Fikirden Ürüne 4 Adım
        </h2>
        <TypingText
          as="p"
          text="Kayıt olduğun andan projeni birlikte inşa etmeye başladığın ana kadar."
          className="mt-3 text-sm text-slate-600 sm:text-base"
          speed={26}
        />
      </div>

      <div className="relative mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-slate-300/60 lg:block" />
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="reveal relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#44ACFF] shadow-sm">
                <Icon size={20} />
              </div>
              <span className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Adım {i + 1}
              </span>
              <h3 className="mt-1.5 text-base font-bold text-slate-800">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
