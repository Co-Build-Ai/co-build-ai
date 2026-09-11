import { Lock, Zap, Target, MessageCircle } from "lucide-react";

const BENEFITS = [
  {
    icon: Lock,
    title: "Verin Yurt Dışına Çıkmaz",
    description:
      "PRD üretimi kendi GPU sunucumuzda, açık kaynak bir modelle çalışır — OpenAI/Gemini gibi dış API'lere hiçbir veri gönderilmez.",
  },
  {
    icon: Zap,
    title: "Dakikalar İçinde Şartname",
    description:
      "Birkaç cümlelik fikrin, kendi kendini denetleyip düzelten bir agent döngüsüyle profesyonel bir PRD'ye dönüşür.",
  },
  {
    icon: Target,
    title: "Anlam Bazlı Eşleştirme",
    description:
      "Anahtar kelime eşleşmesi değil, embedding tabanlı semantik arama — projenin gerçekten ihtiyaç duyduğu beceriler öne çıkar.",
  },
  {
    icon: MessageCircle,
    title: "Süreç Boyunca Şeffaflık",
    description:
      "Teklif, anlık sohbet ve bildirimlerle fikir sahibi ve yazılımcı, projenin her adımında aynı sayfada kalır.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="px-6 py-20 sm:px-12">
      <div className="reveal mx-auto max-w-2xl text-center">
        <span className="badge-soft w-fit rounded-full bg-white px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#5f06cc]">
          Neden Co-Build AI?
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-clash-display)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Fikirle Yetenek Arasındaki Mesafeyi Kısaltıyoruz
        </h2>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="reveal panel-3d flex gap-4 rounded-2xl bg-white p-6"
            >
              <span className="icon-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5f06cc] text-white">
                <Icon size={18} />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-clash-display)] text-base font-bold text-[#111827]">{benefit.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#4b5563]">{benefit.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
