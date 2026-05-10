import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export function MessagesFab() {
  const { profile } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", profile.id)
        .is("read_at", null);
      setUnread(count ?? 0);
    };
    load();
    const channel = supabase
      .channel(`fab-msgs-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${profile.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return (
    <Link
      to="/messages"
      aria-label="Chat"
      className="fixed bottom-28 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground pl-4 pr-5 py-3 font-semibold shadow-elevated active:scale-95 transition-transform"
    >
      <MessageCircle className="size-5" />
      <span className="text-sm">Chat</span>
      {unread > 0 && (
        <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold grid place-items-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
