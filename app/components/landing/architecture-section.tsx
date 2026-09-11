import { Cpu, RefreshCw, ShieldCheck, Network } from "lucide-react";
import TypingText from "./typing-text";

const ITEMS = [
  {
    icon: Cpu,
    title: "vLLM & Qwen",
    description:
      "Qwen2.5-32B, kendi GPU sunucumuzda vLLM ile çalışıyor. Fikrin hiçbir zaman OpenAI/Gemini gibi dış API'lere gitmiyor.",
    status: "live" as const,
  },
  {
    icon: RefreshCw,
    title: "Agentic RAG",
    description:
      "Teknik şartnameyi tek seferde değil, kendi çıktısını denetleyip revize eden bir agent döngüsüyle üretiyor.",
    status: "live" as const,
  },
  {
    icon: ShieldCheck,
    title: "Patent Doğrulama",
    description:
      "Fikrini mevcut patentlerle kıyaslayan ön kontrol ve tescilli mucitlere eşleştirmede öncelik veren çarpan sistemi.",
    status: "soon" as const,
  },
  {
    icon: Network,
    title: "Semantik Eşleştirme",
    description:
      "Supabase pgvector ile embedding tabanlı arama; anahtar kelimeye değil anlama göre en uygun yazılımcıları buluyor.",
    status: "live" as const,
  },
];

export default function ArchitectureSection({ idSuffix = "" }: { idSuffix?: string }) {
  return (
    <section id={`nasil-calisir${idSuffix}`} className="px-6 py-20 sm:px-12">
      <h2 className="reveal text-center font-[family-name:var(--font-clash-display)] text-3xl font-bold tracking-tight text-white">
        Arka Planda Ne Çalışıyor?
      </h2>
      <TypingText
        as="p"
        text="Fikrini yazdığın andan yazılımcıyla eşleştiğin ana kadar devrede olan teknoloji."
        className="reveal mx-auto mt-3 max-w-xl text-center text-sm text-white"
        speed={26}
      />

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="reveal panel-3d flex flex-col rounded-2xl bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <span className="icon-3d flex h-10 w-10 items-center justify-center rounded-full bg-[#063ecc] text-white">
                  <Icon size={18} />
                </span>
                {item.status === "soon" && (
                  <span className="badge-soft rounded-full bg-black/5 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#4b5563]">
                    Yakında
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-clash-display)] text-base font-bold text-[#111827]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
