"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  item_type: "project" | "certificate";
  issuer: string | null;
  item_date: string | null;
};

export default function PortfolioSection({
  userId,
  items,
  readOnly = false,
}: {
  userId: string;
  items: PortfolioItem[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [itemType, setItemType] = useState<"project" | "certificate">("project");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issuer, setIssuer] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);

    await supabase.from("portfolio_items").insert({
      developer_id: userId,
      title,
      description: description || null,
      item_type: itemType,
      issuer: issuer || null,
      item_date: itemDate || null,
      file_url: fileUrl || null,
    });

    setSaving(false);
    setShowForm(false);
    setTitle("");
    setDescription("");
    setIssuer("");
    setItemDate("");
    setFileUrl("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    await supabase.from("portfolio_items").delete().eq("id", id);
    router.refresh();
  }

  const projects = items.filter((i) => i.item_type === "project");
  const certificates = items.filter((i) => i.item_type === "certificate");

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          Projeler ve Sertifikalar
        </h2>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-semibold text-coral-dark hover:underline"
          >
            {showForm ? "Vazgeç" : "+ Ekle"}
          </button>
        )}
      </div>

      {!readOnly && showForm && (
        <div className="mt-4 rounded-xl border border-coral/30 bg-white p-5">
          <div className="flex gap-3">
            <button
              onClick={() => setItemType("project")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                itemType === "project"
                  ? "bg-coral text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_var(--color-coral-dark),0_6px_14px_rgba(239,68,104,0.30)] active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.25)]"
                  : "bg-ink/5 text-ink-soft shadow-[inset_0_1px_3px_rgba(17,24,39,0.06)]"
              }`}
            >
              Proje
            </button>
            <button
              onClick={() => setItemType("certificate")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                itemType === "certificate"
                  ? "bg-periwinkle-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_#5b21b6,0_6px_14px_rgba(109,40,217,0.30)] active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_#5b21b6,0_2px_6px_rgba(109,40,217,0.25)]"
                  : "bg-ink/5 text-ink-soft shadow-[inset_0_1px_3px_rgba(17,24,39,0.06)]"
              }`}
            >
              Sertifika
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder={itemType === "project" ? "Proje adı" : "Sertifika adı"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
            />
            <textarea
              placeholder="Açıklama (isteğe bağlı)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
            />
            {itemType === "certificate" && (
              <input
                type="text"
                placeholder="Veren kurum (örn. Google, Udemy)"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
              />
            )}
            <input
              type="date"
              value={itemDate}
              onChange={(e) => setItemDate(e.target.value)}
              className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
            />
            <input
              type="text"
              placeholder="Link (GitHub, sertifika linki, vb. — isteğe bağlı)"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="self-start rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
            >
              {saving ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ink-soft">Projeler</h3>
          <div className="mt-2 flex flex-col gap-3">
            {projects.map((item) => (
              <ItemCard key={item.id} item={item} onDelete={readOnly ? undefined : handleDelete} />
            ))}
          </div>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ink-soft">Sertifikalar</h3>
          <div className="mt-2 flex flex-col gap-3">
            {certificates.map((item) => (
              <ItemCard key={item.id} item={item} onDelete={readOnly ? undefined : handleDelete} />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="mt-4 rounded-xl border border-dashed border-ink/15 bg-white/60 p-8 text-center">
          <p className="text-2xl">🗂️</p>
          <p className="mt-2 text-sm text-ink-soft">
            {readOnly
              ? "Henüz bir proje ya da sertifika eklenmemiş."
              : "Henüz bir proje ya da sertifika eklemedin. Founder'lar seni değerlendirirken bunlara bakacak."}
          </p>
        </div>
      )}
    </div>
  );
}

function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /^https?:\/\/(?:www\.)?github\.com\/([^\/\s]+)\/([^\/\s]+?)(?:\.git)?(?:[\/?#].*)?$/i
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function ItemCard({
  item,
  onDelete,
}: {
  item: PortfolioItem;
  onDelete?: (id: string) => void;
}) {
  const [lastCommit, setLastCommit] = useState<{
    message: string;
    date: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const repo = item.file_url ? parseGithubRepo(item.file_url) : null;
    if (!repo) return;

    let cancelled = false;
    fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/commits?per_page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.[0]) return;
        setLastCommit({
          message: data[0].commit.message.split("\n")[0],
          date: data[0].commit.author.date,
          url: data[0].html_url,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [item.file_url]);

  return (
    <div className="flex items-start justify-between rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-6">
      <div>
        <p className="text-sm font-bold text-ink">{item.title}</p>
        {item.issuer && <p className="text-xs text-ink-soft">{item.issuer}</p>}
        {item.description && <p className="mt-1 text-xs text-ink-soft">{item.description}</p>}
        <div className="mt-1 flex gap-3 text-xs text-ink-soft">
          {item.item_date && <span>{item.item_date}</span>}
          {item.file_url && (
            <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-coral-dark hover:underline">
              Linki gör →
            </a>
          )}
        </div>
        {lastCommit && (
          <a
            href={lastCommit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-xs text-ink-soft hover:text-ink"
          >
            <span className="font-mono text-periwinkle-dark">Son commit:</span>{" "}
            {lastCommit.message}
            <span className="text-ink-soft/70">
              {" "}
              · {new Date(lastCommit.date).toLocaleDateString("tr-TR")}
            </span>
          </a>
        )}
      </div>
      {onDelete && (
        <button onClick={() => onDelete(item.id)} className="text-xs text-ink-soft hover:text-red-600">
          Sil
        </button>
      )}
    </div>
  );
}