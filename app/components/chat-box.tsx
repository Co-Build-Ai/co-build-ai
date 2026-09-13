"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Message = {
  id: string;
  offer_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBox({
  offerId,
  userId,
  otherUserId,
  otherUserName,
  projectId,
}: {
  offerId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  projectId: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("messages")
      .select("*")
      .eq("offer_id", offerId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) setMessages(data);

        // Karşı taraftan gelen, henüz okunmamış mesajları okundu işaretle
        supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("offer_id", offerId)
          .neq("sender_id", userId)
          .is("read_at", null)
          .then();
      });

    const channel = supabase
      .channel(`messages-${offerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `offer_id=eq.${offerId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [offerId, userId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);

    await supabase.from("messages").insert({
      offer_id: offerId,
      sender_id: userId,
      content: text,
    });

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      project_id: projectId,
      type: "new_message",
      message: "Teklifinle ilgili yeni bir mesajın var.",
    });

    setText("");
    setSending(false);
  }

  return (
    <div id={`chat-${offerId}`} className="mt-4 scroll-mt-24 rounded-lg bg-ink/5 p-3">
      <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        Mesajlar
      </p>
      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="p-2 text-center text-xs text-ink-soft">
            Henüz mesaj yok, ilk mesajı sen gönderebilirsin.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex max-w-[80%] flex-col ${isMine ? "self-end items-end" : "self-start items-start"}`}>
                <span className="mb-0.5 px-1 text-[11px] text-ink-soft">
                  {isMine ? "Sen" : otherUserName} · {formatTime(m.created_at)}
                </span>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-[#1a7a52] text-white" : "bg-white text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Mesaj yaz..."
          className="flex-1 rounded-lg border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="rounded-lg bg-[#1a7a52] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
