import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Search, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/messages")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: MessagesList,
});

interface Conversation {
  peer_id: string;
  peer_name: string;
  peer_role: string;
  last_message: string;
  last_at: string;
  unread: number;
}

function MessagesList() {
  const { profile } = useSession();
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      const byPeer = new Map<string, Conversation>();
      for (const m of (msgs ?? []) as any[]) {
        const peerId = m.sender_id === profile.id ? m.recipient_id : m.sender_id;
        if (byPeer.has(peerId)) {
          if (m.recipient_id === profile.id && !m.read_at) {
            byPeer.get(peerId)!.unread += 1;
          }
          continue;
        }
        byPeer.set(peerId, {
          peer_id: peerId,
          peer_name: "",
          peer_role: "",
          last_message: m.content,
          last_at: m.created_at,
          unread: m.recipient_id === profile.id && !m.read_at ? 1 : 0,
        });
      }

      if (byPeer.size === 0) {
        setConvos([]);
        return;
      }

      const ids = Array.from(byPeer.keys());

      // Only keep peers who currently share an active (non-completed) task
      const { data: activeReqs } = await supabase
        .from("requests")
        .select("requester_id, claimed_by, status")
        .neq("status", "completed")
        .or(`requester_id.eq.${profile.id},claimed_by.eq.${profile.id}`);
      const activePeers = new Set<string>();
      for (const r of (activeReqs ?? []) as any[]) {
        if (!r.claimed_by) continue;
        const peer = r.requester_id === profile.id ? r.claimed_by : r.requester_id;
        if (peer) activePeers.add(peer);
      }
      for (const id of ids) {
        if (!activePeers.has(id)) byPeer.delete(id);
      }

      if (byPeer.size === 0) {
        setConvos([]);
        return;
      }

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name, role")
        .in("id", Array.from(byPeer.keys()));
      for (const p of (profs ?? []) as any[]) {
        const c = byPeer.get(p.id);
        if (c) {
          c.peer_name = p.name;
          c.peer_role = p.role;
        }
      }
      setConvos(Array.from(byPeer.values()));
    };
    load();
    const channel = supabase
      .channel(`msgs-list-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const home = profile?.role === "volunteer" ? "/volunteer" : "/dashboard";
  const filtered = (convos ?? []).filter((c) =>
    c.peer_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <header className="container-app pt-6 pb-3 flex items-center justify-between">
        <Link to={home} className="size-10 grid place-items-center rounded-full bg-card border">
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-primary font-bold text-lg">Messages</p>
        <div className="size-10" />
      </header>

      <div className="container-app">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-full bg-card border pl-11 pr-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mt-5">
          {convos === null ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-14 rounded-full bg-primary-soft text-primary grid place-items-center mx-auto">
                <MessageCircle className="size-7" />
              </div>
              <p className="mt-4 font-semibold">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Open a task and tap Message to start chatting with a {profile?.role === "volunteer" ? "caregiver" : "volunteer"}.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((c) => (
                <li key={c.peer_id}>
                  <Link
                    to="/messages/$peerId"
                    params={{ peerId: c.peer_id }}
                    className="flex items-center gap-3 rounded-2xl bg-card border p-3 active:scale-[0.99] transition-transform"
                  >
                    <div className="size-12 shrink-0 rounded-full bg-primary-soft text-primary grid place-items-center text-lg font-semibold">
                      {c.peer_name.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold truncate">{c.peer_name || "Unknown"}</p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {timeAgo(c.last_at)}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {c.last_message}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="size-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center">
                        {c.unread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
