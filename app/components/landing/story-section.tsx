import { Lightbulb, FileText, Users2, Compass, Send, Code2, Repeat, Layers, Sparkles } from "lucide-react";

const STORIES = [
  {
    id: "founder",
    color: "#FE9EC7",
    textColor: "#c23570",

    title: "Fikrin, bir gecede teknik şartnameye dönüşür",
    description:
      "Kod bilmene gerek yok. Aklındaki fikri kendi cümlelerinle anlat, gerisini Agentic RAG halletsin.",
    steps: [
      { icon: Lightbulb, text: "Fikrini yaz" },
      { icon: FileText, text: "AI senin için PRD üretsin" },
      { icon: Users2, text: "Doğru ekiple eşleş" },
    ],
    direction: "left" as const,
  },
  {
    id: "developer",
    color: "#8DD9A8",
    textColor: "#1a7a52",

    title: "Projeleri keşfet, doğru olanı seç, inşa et",
    description:
      "Anahtar kelime değil, anlam bazlı eşleştirme. Beceri setine tam uyan projeler önüne geliyor.",
    steps: [
      { icon: Compass, text: "Projeleri keşfet" },
      { icon: Send, text: "Teklifini gönder" },
      { icon: Code2, text: "Kodla, teslim et" },
    ],
    direction: "right" as const,
  },
  {
    id: "dual",
    color: "#44ACFF",
    textColor: "#1666a8",

    title: "Hem fikir üret hem koda dök, tek hesapla",
    description:
      "Fikir Sahibi ve Yazılımcı modları arasında istediğin an geçiş yap; iki dünyayı birden yaşa.",
    steps: [
      { icon: Layers, text: "Hem fikir hem kod" },
      { icon: Repeat, text: "Rol değiştir" },
      { icon: Sparkles, text: "İki dünyayı da yaşa" },
    ],
    direction: "left" as const,
  },
];

export default function StorySection() {
  return (
    <section className="px-6 py-20 sm:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        {STORIES.map((story) => {
          const isRight = story.direction === "right";
          return (
            <div
              key={story.id}
              className={`flex flex-col gap-8 sm:gap-10 ${
                isRight ? "sm:flex-row-reverse" : "sm:flex-row"
              } sm:items-center`}
            >
              <div
                className={`story-reveal ${
                  isRight ? "story-reveal--right" : ""
                } flex-1`}
              >
                <span
                  className="w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ background: `${story.color}40`, color: story.textColor }}
                >
                  {story.id === "founder" ? "Fikir Sahibi" : story.id === "developer" ? "Yazılımcı" : "Dual Hesap"}
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-jakarta)] text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
                  {story.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                  {story.description}
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                {story.steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.text}
                      className="story-reveal story-reveal--up story-reveal--step flex items-center gap-4 rounded-2xl bg-white/80 px-5 py-4 shadow-sm"
                      style={{ ["--story-delay" as string]: `${i * 0.15}s` }}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                        style={{ background: story.color }}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        {step.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
