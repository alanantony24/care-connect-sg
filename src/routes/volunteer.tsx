import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MessagesFab } from "@/components/MessagesFab";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2, Award, Heart, ChevronRight } from "lucide-react";
import mascot from "@/assets/mascot.png";
import { RequestCard, CardSkeleton } from "./dashboard";
import { TASK_TYPES, taskBadgeStyle } from "@/lib/tasks";
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

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("requests")
      .select("*, requester:profiles!requests_requester_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setRows((data ?? []) as RequestRow[]));
  }, [profile]);

  const openList = (rows ?? []).filter((r) => r.status === "open");
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
      ? { name: "Helping Hand", target: 5, current: tasksHelped, Icon: Heart }
      : tasksHelped < 20
        ? { name: "Guardian Angel", target: 20, current: tasksHelped, Icon: Award }
        : null;

  return (
    <AppShell>
      <PageHeader
        title={`${getGreeting()}, ${profile.name.split(" ")[0]}`}
        right={
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="size-10 grid place-items-center rounded-full bg-card border"
          >
            <Bell className="size-5" />
          </Link>
        }
      />

      <div className="container-app">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Tasks completed" value={tasksHelped} />
          <Stat label="Volunteer hours" value={`${hours}h`} />
        </div>

        {nextBadge && (
          <div className="mt-4 rounded-2xl p-4 shadow-elevated text-white relative overflow-hidden bg-gradient-to-br from-[#D4AF37] via-[#C9962B] to-[#8B6914]">
            <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/15 blur-xl" />
            <div className="relative flex items-start gap-3">
              <span className="size-12 grid place-items-center rounded-2xl bg-white/20 backdrop-blur shrink-0">
                <nextBadge.Icon className="size-6" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider opacity-95 font-semibold">
                  Next badge
                </p>
                <p className="text-lg font-bold mt-0.5 leading-tight">{nextBadge.name}</p>
                <div className="mt-2.5 h-2 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(nextBadge.current / nextBadge.target) * 100}%` }}
                  />
                </div>
                <p className="text-xs opacity-95 mt-1.5 font-medium">
                  {nextBadge.current}/{nextBadge.target} tasks
                </p>
              </div>
            </div>
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

        <div className="mt-3">
          {rows === null ? (
            <CardSkeleton />
          ) : (
            <div className="rounded-2xl bg-card/70 border p-4 shadow-card backdrop-blur-xl">
              <div className="grid grid-cols-3 gap-2.5">
                {TASK_TYPES.map((t) => {
                  const style = taskBadgeStyle(t.value);
                  const Icon = t.icon;
                  const count = openList.filter((r) => r.task_type === t.value).length;
                  return (
                    <div
                      key={t.value}
                      className={`relative overflow-hidden flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border ${style.glass} p-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.9)] backdrop-blur-xl`}
                    >
                      <span
                        className={`absolute -right-6 -top-7 size-20 rounded-full ${style.glow} blur-2xl`}
                      />
                      <span className="absolute inset-x-0 top-0 h-px bg-white/25" />
                      <span
                        className={`relative size-11 grid place-items-center rounded-2xl ${style.icon} shadow-lg backdrop-blur-md`}
                      >
                        <Icon className="size-5" strokeWidth={2.3} />
                      </span>
                      <p className="relative text-2xl font-extrabold leading-none text-slate-900">{count}</p>
                      <p className="relative text-[11px] font-semibold leading-tight text-center text-slate-900">
                        {t.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Link
                to="/feed"
                className="mt-4 w-full rounded-full bg-primary text-primary-foreground py-2.5 font-semibold text-sm flex items-center justify-center gap-1.5 shadow-card active:scale-[0.99] transition-transform"
              >
                View all tasks <ChevronRight className="size-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center text-center opacity-90">
          <img
            src={mascot}
            alt=""
            width={160}
            height={160}
            loading="lazy"
            className="size-32 object-contain drop-shadow-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground max-w-[14rem]">
            Thank you for being part of Komunity.
          </p>
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
