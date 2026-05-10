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
      aria-label="Messages"
      className="fixed bottom-28 right-5 z-30 size-14 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated active:scale-95 transition-transform"
    >
      <MessageCircle className="size-6" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold grid place-items-center border-2 border-background">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
