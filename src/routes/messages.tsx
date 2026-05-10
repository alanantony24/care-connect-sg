import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Search, Loader2, PenSquare, X, Mic } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/messages")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
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

interface PeerOption {
  id: string;
  name: string;
  role: string;
  context: string; // e.g. "Applied to: Walk dad to clinic"
}

function MessagesList() {
  const { profile } = useSession();
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

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
          last_message: previewContent(m.content),
          last_at: m.created_at,
          unread: m.recipient_id === profile.id && !m.read_at ? 1 : 0,
        });
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
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
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
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          aria-label="New chat"
          className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated"
        >
          <PenSquare className="size-5" />
        </button>
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
                Tap the pencil icon to start a chat with{" "}
                {profile?.role === "volunteer" ? "a caregiver" : "a volunteer who applied"}.
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
                        className={`text-sm truncate flex items-center gap-1 ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {c.last_message.startsWith("[voice]") && <Mic className="size-3.5" />}
                        {c.last_message.startsWith("[voice]") ? "Voice message" : c.last_message}
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

      {showPicker && profile && (
        <NewChatPicker profileId={profile.id} role={profile.role} onClose={() => setShowPicker(false)} />
      )}
    </AppShell>
  );
}

function NewChatPicker({
  profileId,
  role,
  onClose,
}: {
  profileId: string;
  role: string;
  onClose: () => void;
}) {
  const nav = useNavigate();
  const [peers, setPeers] = useState<PeerOption[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      if (role === "caregiver") {
        // All volunteers who applied to any of my requests
        const { data: reqs } = await supabase
          .from("requests")
          .select("id, title")
          .eq("requester_id", profileId);
        const reqMap = new Map<string, string>();
        (reqs ?? []).forEach((r: any) => reqMap.set(r.id, r.title));
        if (reqMap.size === 0) return setPeers([]);
        const { data: apps } = await supabase
          .from("applications")
          .select("volunteer_id, request_id, status, created_at")
          .in("request_id", Array.from(reqMap.keys()))
          .order("created_at", { ascending: false });
        const seen = new Map<string, { reqTitle: string; status: string }>();
        (apps ?? []).forEach((a: any) => {
          if (!seen.has(a.volunteer_id))
            seen.set(a.volunteer_id, { reqTitle: reqMap.get(a.request_id) ?? "", status: a.status });
        });
        if (seen.size === 0) return setPeers([]);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, role")
          .in("id", Array.from(seen.keys()));
        setPeers(
          (profs ?? []).map((p: any) => {
            const info = seen.get(p.id)!;
            return {
              id: p.id,
              name: p.name,
              role: p.role,
              context: `${info.status === "accepted" ? "Confirmed" : "Applied"} · ${info.reqTitle}`,
            };
          }),
        );
      } else {
        // Volunteer: caregivers whose tasks I applied to or am claimed on
        const { data: apps } = await supabase
          .from("applications")
          .select("request_id, status, created_at")
          .eq("volunteer_id", profileId)
          .order("created_at", { ascending: false });
        const reqIds = (apps ?? []).map((a: any) => a.request_id);
        if (reqIds.length === 0) return setPeers([]);
        const { data: reqs } = await supabase
          .from("requests")
          .select("id, title, requester_id")
          .in("id", reqIds);
        const seen = new Map<string, { reqTitle: string; status: string }>();
        (reqs ?? []).forEach((r: any) => {
          const app = (apps ?? []).find((a: any) => a.request_id === r.id);
          if (!seen.has(r.requester_id))
            seen.set(r.requester_id, { reqTitle: r.title, status: app?.status ?? "applied" });
        });
        if (seen.size === 0) return setPeers([]);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, role")
          .in("id", Array.from(seen.keys()));
        setPeers(
          (profs ?? []).map((p: any) => {
            const info = seen.get(p.id)!;
            return {
              id: p.id,
              name: p.name,
              role: p.role,
              context: `${info.status === "accepted" ? "Confirmed" : "Applied"} · ${info.reqTitle}`,
            };
          }),
        );
      }
    };
    load();
  }, [profileId, role]);

  const filtered = (peers ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center">
      <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl border-t sm:border shadow-elevated max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <p className="font-bold text-lg">New chat</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-9 grid place-items-center rounded-full hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={role === "caregiver" ? "Search volunteers" : "Search caregivers"}
              autoFocus
              className="w-full rounded-full bg-card border pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {peers === null ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10 px-6">
              {role === "caregiver"
                ? "No volunteers have applied to your tasks yet."
                : "Apply to a task first to start a conversation with the caregiver."}
            </p>
          ) : (
            <ul>
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      nav({ to: "/messages/$peerId", params: { peerId: p.id } });
                    }}
                    className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-muted text-left"
                  >
                    <div className="size-11 rounded-full bg-primary-soft text-primary grid place-items-center font-semibold">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.context}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function previewContent(c: string) {
  return c ?? "";
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
