import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Loader2, Trash2, CheckCircle2, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: NotificationsPage,
});

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function NotificationsPage() {
  const { profile } = useSession();
  const [items, setItems] = useState<Notif[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      setItems((data ?? []) as Notif[]);
      // Mark unread as read
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", profile.id)
        .is("read_at", null);
    };
    load();
    const channel = supabase
      .channel(`notif-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const home = profile?.role === "volunteer" ? "/volunteer" : "/dashboard";

  const clearAll = async () => {
    if (!profile || !items || items.length === 0) return;
    if (!confirm("Clear all notifications?")) return;
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", profile.id);
    if (error) return toast.error(error.message);
    setItems([]);
    toast.success("Notifications cleared");
  };

  return (
    <AppShell>
      <header className="container-app pt-6 pb-3 flex items-center justify-between">
        <Link to={home} className="size-10 grid place-items-center rounded-full bg-card border">
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-primary font-bold text-lg">Notifications</p>
        <button
          type="button"
          onClick={clearAll}
          disabled={!items || items.length === 0}
          aria-label="Clear all"
          className="size-10 grid place-items-center rounded-full bg-card border disabled:opacity-40"
        >
          <Trash2 className="size-5" />
        </button>
      </header>

      <div className="container-app">
        {items === null ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-14 rounded-full bg-primary-soft text-primary grid place-items-center mx-auto">
              <Bell className="size-7" />
            </div>
            <p className="mt-4 font-semibold">You're all caught up</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              You'll see updates here when a task is accepted or someone leaves you a review.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Recent
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-destructive"
              >
                Clear all
              </button>
            </div>
            <ul className="space-y-2">
              {items.map((n) => (
                <NotifRow key={n.id} n={n} />
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}

function NotifRow({ n }: { n: Notif }) {
  const Icon = n.type === "review_received" ? Star : CheckCircle2;
  const tone =
    n.type === "review_received"
      ? "bg-amber-100 text-amber-700"
      : "bg-primary-soft text-primary";
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl bg-card border p-3.5 active:scale-[0.99] transition-transform">
      <span className={`size-10 shrink-0 rounded-full grid place-items-center ${tone}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{n.title}</p>
        {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
        <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
      </div>
    </div>
  );
  if (n.link) {
    return (
      <li>
        <a href={n.link} className="block">
          {inner}
        </a>
      </li>
    );
  }
  return <li>{inner}</li>;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
