import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/messages_/$peerId")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: ChatThread,
});

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

function ChatThread() {
  const { peerId } = Route.useParams();
  const { profile } = useSession();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [peer, setPeer] = useState<{ name: string; role: string } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [hasActiveTask, setHasActiveTask] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("name, role")
      .eq("id", peerId)
      .maybeSingle()
      .then(({ data }) => setPeer(data as any));
  }, [peerId]);

  useEffect(() => {
    if (!profile) return;
    const checkActive = async () => {
      const { data } = await supabase
        .from("requests")
        .select("id")
        .neq("status", "completed")
        .or(
          `and(requester_id.eq.${profile.id},claimed_by.eq.${peerId}),and(requester_id.eq.${peerId},claimed_by.eq.${profile.id})`,
        )
        .limit(1);
      setHasActiveTask((data ?? []).length > 0);
    };
    checkActive();
  }, [profile, peerId]);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${profile.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${profile.id})`,
        )
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);

      // Mark unread incoming as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", peerId)
        .eq("recipient_id", profile.id)
        .is("read_at", null);
    };
    load();

    const channel = supabase
      .channel(`chat-${profile.id}-${peerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          const mine =
            (m.sender_id === profile.id && m.recipient_id === peerId) ||
            (m.sender_id === peerId && m.recipient_id === profile.id);
          if (!mine) return;
          setMessages((prev) => [...(prev ?? []), m]);
          if (m.recipient_id === profile.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", m.id)
              .then(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, peerId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !profile) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: profile.id,
      recipient_id: peerId,
      content: text.trim(),
    });
    setSending(false);
    if (!error) setText("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="container-app py-3 flex items-center gap-3">
          <Link to="/messages" className="size-10 grid place-items-center rounded-full bg-card border">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center font-semibold">
            {peer?.name?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{peer?.name ?? "Loading…"}</p>
            <p className="text-xs text-muted-foreground capitalize">{peer?.role ?? ""}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container-app py-4 space-y-2">
        {messages === null ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            Say hello — your messages will appear here.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === profile?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-snug shadow-card ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </main>

      {hasActiveTask === false ? (
        <div className="sticky bottom-0 bg-muted/40 backdrop-blur border-t">
          <div className="container-app py-4 text-center text-sm text-muted-foreground">
            Chat closed — this task has been completed.
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      ) : (
        <form
          onSubmit={send}
          className="sticky bottom-0 bg-background/95 backdrop-blur border-t"
        >
          <div className="container-app py-3 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-full bg-card border px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated disabled:opacity-50"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            </button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </form>
      )}
    </div>
  );
}
