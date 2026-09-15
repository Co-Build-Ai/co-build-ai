"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type DirectMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function DirectMessageBox({
  userId,
  otherUserId,
  otherUserName,
  initialMessages,
}: {
  userId: string;
  otherUserId: string;
  otherUserName: string;
  initialMessages: DirectMessage[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", otherUserId)
      .eq("recipient_id", userId)
      .is("read_at", null)
      .then();

    const channel = supabase
      .channel(`direct-messages-${[userId, otherUserId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const m = payload.new as DirectMessage & { recipient_id: string };
          const belongs =
            (m.sender_id === userId && m.recipient_id === otherUserId) ||
            (m.sender_id === otherUserId && m.recipient_id === userId);
          if (belongs) {
            setMessages((prev) => [...prev, m]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, otherUserId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);

    await supabase.from("direct_messages").insert({
      sender_id: userId,
      recipient_id: otherUserId,
      content: text,
    });

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      project_id: null,
      type: "new_message",
      message: `${otherUserName} sana bir mesaj gönderdi.`,
    });

    setText("");
    setSending(false);
  }

  return (
    <div className="flex flex-col rounded-xl border border-black/[0.08] bg-white shadow-sm">
      <div className="flex max-h-[60vh] min-h-[300px] flex-col gap-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <p className="p-2 text-center text-sm text-ink-soft">
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
                    isMine ? "bg-[#1a7a52] text-white" : "bg-black/[0.04] text-ink"
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
      <div className="flex gap-2 border-t border-black/[0.06] p-3">
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
