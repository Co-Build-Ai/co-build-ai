"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { ActiveRole } from "@/app/lib/roles";

export default function RoleSwitcher({
  userId,
  activeRole,
  collapsed,
}: {
  userId: string;
  activeRole: ActiveRole;
  collapsed: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function switchTo(role: ActiveRole) {
    if (role === activeRole || loading) return;
    setLoading(true);
    await supabase.from("profiles").update({ active_role: role }).eq("id", userId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className={`px-1 ${collapsed ? "hidden" : "hidden md:block"}`}>
      <div className="flex rounded-full bg-ink/5 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => switchTo("founder")}
          disabled={loading}
          title="Fikir Sahibi moduna geç"
          className={`flex-1 rounded-full px-2.5 py-1.5 transition-colors ${
            activeRole === "founder" ? "bg-coral text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          Fikir Sahibi
        </button>
        <button
          type="button"
          onClick={() => switchTo("developer")}
          disabled={loading}
          title="Yazılımcı moduna geç"
          className={`flex-1 rounded-full px-2.5 py-1.5 transition-colors ${
            activeRole === "developer" ? "bg-periwinkle-dark text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          Yazılımcı
        </button>
      </div>
    </div>
  );
}
