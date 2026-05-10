import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MessagesFab } from "@/components/MessagesFab";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2 } from "lucide-react";
import { RequestCard, CardSkeleton, EmptyHint } from "./dashboard";
import { getGreeting } from "@/lib/format";

export const Route = createFileRoute("/volunteer")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: VolunteerHome,
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
  requester_id: string;
  requester?: { name: string } | null;
}

function VolunteerHome() {
  const { profile } = useSession();
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "nearby" | "urgent">("all");

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("requests")
      .select("*, requester:profiles!requests_requester_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setRows((data ?? []) as RequestRow[]));
  }, [profile]);

  const visible = useMemo(() => {
    const list = (rows ?? []).filter((r) => r.status === "open");
    if (filter === "urgent") {
      return list.filter((r) => {
        const ageHours = (Date.now() - new Date(r.created_at).getTime()) / 36e5;
        return ageHours < 12;
      });
    }
    return list;
  }, [rows, filter]);

  const myActive = (rows ?? []).find((r) => r.claimed_by === profile?.id && r.status === "claimed");

  if (!profile) {
    return (
      <AppShell>
        <div className="container-app pt-12 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const tasksHelped = profile.tasks_helped;
  const hours = tasksHelped * 2;

  // Next badge: Helping Hand at 5, Guardian Angel at 20
  const nextBadge =
    tasksHelped < 5
      ? { name: "Helping Hand", target: 5, current: tasksHelped }
      : tasksHelped < 20
        ? { name: "Guardian Angel", target: 20, current: tasksHelped }
        : null;

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
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Tasks completed" value={tasksHelped} />
          <Stat label="Volunteer hours" value={`${hours}h`} />
        </div>

        {nextBadge && (
          <div className="mt-4 rounded-2xl bg-primary text-primary-foreground p-4 shadow-elevated">
            <p className="text-xs uppercase tracking-wider opacity-90">Next badge</p>
            <p className="text-lg font-semibold mt-1">{nextBadge.name}</p>
            <div className="mt-3 h-2 rounded-full bg-primary-foreground/20 overflow-hidden">
              <div
                className="h-full bg-primary-foreground"
                style={{ width: `${(nextBadge.current / nextBadge.target) * 100}%` }}
              />
            </div>
            <p className="text-xs opacity-90 mt-2">
              {nextBadge.current}/{nextBadge.target} tasks
            </p>
          </div>
        )}

        {myActive && (
          <div className="mt-5">
            <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Your active task
            </h2>
            <RequestCard r={myActive} />
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Available tasks
          </h2>
        </div>

        <div className="mt-3 flex gap-2">
          {(["all", "nearby", "urgent"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {rows === null ? (
            <CardSkeleton />
          ) : visible.length === 0 ? (
            <EmptyHint
              title="No open tasks right now"
              hint="Check back soon — new tasks appear all day."
            />
          ) : (
            <div className="space-y-3">
              {visible.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </div>
      </div>
      <MessagesFab />
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-card border p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
