import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2, MapPin, Plus } from "lucide-react";
import { taskMeta } from "@/lib/tasks";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: Dashboard,
});

interface RequestRow {
  id: string;
  title: string;
  task_type: string;
  location: string;
  date_needed: string;
  time_needed: string;
  status: string;
  created_at: string;
  claimed_by: string | null;
  payment_amount?: number | null;
  claimer?: { name: string } | null;
}

function Dashboard() {
  const { profile } = useSession();
  const nav = useNavigate();
  const [rows, setRows] = useState<RequestRow[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === "volunteer") {
      nav({ to: "/volunteer", replace: true });
      return;
    }
    supabase
      .from("requests")
      .select("*, claimer:profiles!requests_claimed_by_fkey(name)")
      .eq("requester_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
          setRows([]);
          return;
        }
        setRows((data ?? []) as RequestRow[]);
      });
  }, [profile, nav]);

  if (!profile) {
    return (
      <AppShell>
        <div className="container-app pt-12 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const open = (rows ?? []).filter((r) => r.status === "open");
  const active = (rows ?? []).filter((r) => r.status !== "open");

  return (
    <AppShell>
      <PageHeader
        title={`Hi, ${profile.name.split(" ")[0]}`}
        subtitle="Here's what's happening with your care requests."
        right={
          <span className="size-10 grid place-items-center rounded-full bg-card border">
            <Bell className="size-5" />
          </span>
        }
      />

      <div className="container-app">
        <Link
          to="/requests/new"
          className="flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground p-4 shadow-elevated"
        >
          <span className="size-11 grid place-items-center rounded-xl bg-primary-foreground/15">
            <Plus className="size-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">Post a new request</p>
            <p className="text-xs opacity-90">A volunteer can pick it up in minutes.</p>
          </div>
        </Link>

        <h2 className="mt-7 mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Open requests
        </h2>
        {rows === null ? (
          <CardSkeleton />
        ) : open.length === 0 ? (
          <EmptyHint title="No open requests" hint="Tap 'Post a new request' to get started." />
        ) : (
          <div className="space-y-3">
            {open.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </div>
        )}

        <h2 className="mt-8 mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          In progress &amp; completed
        </h2>
        {rows === null ? null : active.length === 0 ? (
          <EmptyHint title="No active tasks yet" />
        ) : (
          <div className="space-y-3">
            {active.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function RequestCard({ r }: { r: RequestRow & { requester?: { name: string } | null } }) {
  const meta = taskMeta(r.task_type);
  const Icon = meta.icon;
  const tone =
    r.status === "open"
      ? "bg-primary-soft text-primary-soft-foreground"
      : r.status === "claimed"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-success/15 text-success";
  return (
    <Link
      to="/requests/$id"
      params={{ id: r.id }}
      className="block rounded-2xl bg-card border p-4 shadow-card active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-3">
        <span className="size-11 grid place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
          <Icon className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-tight">{r.title}</p>
            <span className={`text-[10px] font-semibold uppercase rounded-full px-2 py-1 ${tone}`}>
              {r.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{meta.label}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            <span className="truncate">{r.location}</span>
            <span>·</span>
            <span>{r.date_needed}</span>
            <span>·</span>
            <span>{r.time_needed}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl bg-card border p-4 h-24 animate-pulse" />
      ))}
    </div>
  );
}

export function EmptyHint({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/60 p-8 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
