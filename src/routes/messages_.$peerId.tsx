import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, Mic, Square, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { toast } from "sonner";

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

const VOICE_PREFIX = "[voice]";

function ChatThread() {
  const { peerId } = Route.useParams();
  const { profile } = useSession();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [peer, setPeer] = useState<{ name: string; role: string } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelRecRef = useRef(false);
  const recTimerRef = useRef<number | null>(null);
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
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${profile.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${profile.id})`,
        )
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);

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
    if (error) toast.error(error.message);
    else setText("");
  };

  const startRecording = async () => {
    if (!profile) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      cancelRecRef.current = false;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recTimerRef.current) {
          clearInterval(recTimerRef.current);
          recTimerRef.current = null;
        }
        setRecording(false);
        if (cancelRecRef.current) {
          chunksRef.current = [];
          return;
        }
        await uploadAndSendVoice();
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = window.setInterval(() => {
        setRecSeconds((s) => {
          if (s >= 119) {
            stopRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    cancelRecRef.current = false;
    recorderRef.current?.stop();
  };

  const cancelRecording = () => {
    cancelRecRef.current = true;
    recorderRef.current?.stop();
  };

  const uploadAndSendVoice = async () => {
    if (!profile || chunksRef.current.length === 0) return;
    setUploadingVoice(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const path = `${profile.id}/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage
        .from("voice-messages")
        .upload(path, blob, { contentType: "audio/webm" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("voice-messages").getPublicUrl(path);
      const { error: msgErr } = await supabase.from("messages").insert({
        sender_id: profile.id,
        recipient_id: peerId,
        content: `${VOICE_PREFIX}${pub.publicUrl}`,
      });
      if (msgErr) throw msgErr;
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send voice message");
    } finally {
      setUploadingVoice(false);
      chunksRef.current = [];
    }
  };

  const fmtRec = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
            const isVoice = m.content.startsWith(VOICE_PREFIX);
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-snug shadow-card ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border rounded-bl-md"
                  }`}
                >
                  {isVoice ? (
                    <audio
                      controls
                      src={m.content.slice(VOICE_PREFIX.length)}
                      className="max-w-[240px] w-full"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  )}
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

      <form onSubmit={send} className="sticky bottom-0 bg-background/95 backdrop-blur border-t">
        <div className="container-app py-3 flex items-center gap-2">
          {recording ? (
            <>
              <button
                type="button"
                onClick={cancelRecording}
                aria-label="Cancel recording"
                className="size-12 grid place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <Trash2 className="size-5" />
              </button>
              <div className="flex-1 flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/30 px-4 py-3">
                <span className="size-2.5 rounded-full bg-destructive animate-pulse" />
                <p className="text-sm font-medium text-destructive">
                  Recording… {fmtRec(recSeconds)}
                </p>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                aria-label="Stop and send"
                className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated"
              >
                <Square className="size-5 fill-current" />
              </button>
            </>
          ) : (
            <>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                disabled={uploadingVoice}
                className="flex-1 rounded-full bg-card border px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
              {text.trim() ? (
                <button
                  type="submit"
                  disabled={sending}
                  aria-label="Send message"
                  className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated disabled:opacity-50"
                >
                  {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={uploadingVoice}
                  aria-label="Record voice message"
                  className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated disabled:opacity-50"
                >
                  {uploadingVoice ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </form>
    </div>
  );
}
