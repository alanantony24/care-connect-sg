import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MessagesFab } from "@/components/MessagesFab";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2, MapPin, Plus, Calendar, ChevronRight } from "lucide-react";
import { taskMeta } from "@/lib/tasks";
import { formatDateFriendly, formatTimeFriendly, getGreeting } from "@/lib/format";
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
  started_at?: string | null;
  claimed_by: string | null;
  payment_amount?: number | null;
  claimer?: { name: string } | null;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
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

  const list = rows ?? [];
  const inProgress = list.find((r) => r.status === "claimed" && r.started_at);
  const upcomingToday = list.filter(
    (r) => r !== inProgress && r.status !== "completed" && isToday(r.date_needed),
  );
  const open = list.filter(
    (r) => r.status === "open" && !upcomingToday.includes(r),
  );

  return (
    <AppShell>
      <PageHeader
        title={`${getGreeting()},`}
        subtitle={profile.name.split(" ")[0]}
        right={
          <span className="size-10 grid place-items-center rounded-full bg-card border">
            <Bell className="size-5" />
          </span>
        }
      />

      <div className="container-app">
        {/* In-progress hero card */}
        {inProgress && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                In Progress
              </h2>
              <span className="rounded-full bg-success/15 text-success text-[11px] font-semibold px-2.5 py-1">
                Active
              </span>
            </div>
            <InProgressCard r={inProgress} />
          </section>
        )}

        {/* Post new request */}
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

        {/* Upcoming today */}
        {upcomingToday.length > 0 && (
          <section className="mt-7">
            <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Upcoming Today
            </h2>
            <div className="space-y-3">
              {upcomingToday.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </div>
          </section>
        )}

        {/* Open requests */}
        <section className="mt-7">
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Open Requests
          </h2>
          {rows === null ? (
            <CardSkeleton />
          ) : open.length === 0 && !inProgress && upcomingToday.length === 0 ? (
            <EmptyHint title="No open requests" hint="Tap 'Post a new request' to get started." />
          ) : open.length === 0 ? (
            <EmptyHint title="All caught up" hint="No open requests right now." />
          ) : (
            <div className="space-y-3">
              {open.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>
      </div>
      <MessagesFab />
    </AppShell>
  );
}

function InProgressCard({ r }: { r: RequestRow }) {
  const meta = taskMeta(r.task_type);
  const Icon = meta.icon;
  return (
    <Link
      to="/requests/$id"
      params={{ id: r.id }}
      className="block rounded-3xl bg-card border-2 border-primary/30 p-5 shadow-elevated active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-4">
        <span className="size-14 grid place-items-center rounded-2xl bg-primary text-primary-foreground shrink-0">
          <Icon className="size-7" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold leading-tight">{r.title}</p>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>{formatTimeFriendly(r.time_needed)}</span>
          </div>
          {r.claimer && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
              <span className="size-7 rounded-full bg-primary-soft text-primary grid place-items-center text-xs font-bold">
                {r.claimer.name.charAt(0)}
              </span>
              <p className="text-sm font-medium truncate">{r.claimer.name}</p>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="mt-4 w-full rounded-full bg-primary text-primary-foreground py-3 font-semibold shadow-elevated flex items-center justify-center gap-2"
      >
        <PlayCircle className="size-5" /> Continue Task
      </button>
    </Link>
  );
}

export function RequestCard({ r }: { r: RequestRow & { requester?: { name: string } | null } }) {
  const meta = taskMeta(r.task_type);
  const Icon = meta.icon;
  const displayStatus = r.status === "claimed" && r.started_at ? "in progress" : r.status;
  const tone =
    r.status === "open"
      ? "bg-primary-soft text-primary"
      : displayStatus === "in progress" || r.status === "claimed"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-success/15 text-success";
  return (
    <div className="rounded-2xl bg-card border p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="size-11 grid place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
          <Icon className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-tight">{r.title}</p>
            <span className={`text-[10px] font-semibold uppercase rounded-full px-2 py-1 whitespace-nowrap ${tone}`}>
              {displayStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{meta.label}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{r.location}</span>
            <span>·</span>
            <span className="whitespace-nowrap">{formatDateFriendly(r.date_needed)}</span>
            <span>·</span>
            <span className="whitespace-nowrap">{formatTimeFriendly(r.time_needed)}</span>
          </div>
          {r.payment_amount != null && Number(r.payment_amount) > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft text-primary px-2.5 py-1 text-xs font-semibold">
              S${Number(r.payment_amount).toFixed(0)}
            </div>
          )}
        </div>
      </div>
      <Link
        to="/requests/$id"
        params={{ id: r.id }}
        className="mt-3 w-full rounded-full bg-primary text-primary-foreground py-2.5 font-semibold text-sm flex items-center justify-center gap-1.5 shadow-card active:scale-[0.99] transition-transform"
      >
        View Task <ChevronRight className="size-4" />
      </Link>
    </div>
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
