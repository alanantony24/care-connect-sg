import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, MessageCircle } from "lucide-react";
import { RequestCard, CardSkeleton, EmptyHint } from "./dashboard";
import { TASK_TYPES, type TaskType } from "@/lib/tasks";

export const Route = createFileRoute("/feed")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: Feed,
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
  requester_id: string;
  payment_amount?: number | null;
  requester?: { name: string } | null;
  claimer?: { name: string } | null;
}

const CAREGIVER_TABS = ["pending", "confirmed", "completed"] as const;
const VOLUNTEER_TABS = ["all", "applied", "confirmed", "completed"] as const;
type CTab = (typeof CAREGIVER_TABS)[number];
type VTab = (typeof VOLUNTEER_TABS)[number];

function Feed() {
  const { profile } = useSession();
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<CTab | VTab>("pending");

  useEffect(() => {
    if (!profile) return;
    setTab(profile.role === "caregiver" ? "pending" : "all");
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    const loadRequests = async () => {
      let q = supabase
        .from("requests")
        .select(
          "*, requester:profiles!requests_requester_id_fkey(name), claimer:profiles!requests_claimed_by_fkey(name)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      const filtered =
        profile.role === "caregiver"
          ? q.eq("requester_id", profile.id)
          : q;
      const { data } = await filtered;
      setRows((data ?? []) as RequestRow[]);
    };

    const loadApps = async () => {
      if (profile.role !== "volunteer") return;
      const { data } = await supabase
        .from("applications")
        .select("request_id")
        .eq("volunteer_id", profile.id)
        .eq("status", "pending");
      setAppliedIds(new Set((data ?? []).map((a: any) => a.request_id)));
    };

    loadRequests();
    loadApps();

    const channel = supabase
      .channel(`feed-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => loadRequests())
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => loadApps())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

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
  const tabs = profile.role === "caregiver" ? CAREGIVER_TABS : VOLUNTEER_TABS;

  let visible: RequestRow[] = [];
  if (profile.role === "caregiver") {
    if (tab === "pending") visible = list.filter((r) => r.status === "open");
    else if (tab === "confirmed")
      visible = list.filter((r) => r.status === "claimed");
    else if (tab === "completed") visible = list.filter((r) => r.status === "completed");
  } else {
    if (tab === "all")
      visible = list.filter((r) => r.status === "open" && !appliedIds.has(r.id));
    else if (tab === "applied")
      visible = list.filter((r) => r.status === "open" && appliedIds.has(r.id));
    else if (tab === "confirmed")
      visible = list.filter((r) => r.status === "claimed" && r.claimed_by === profile.id);
    else if (tab === "completed")
      visible = list.filter((r) => r.status === "completed" && r.claimed_by === profile.id);
  }

  return (
    <AppShell>
      <PageHeader
        title="Task Management"
        right={
          profile.role === "caregiver" ? (
            <Link
              to="/requests/new"
              className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated"
              aria-label="Post new request"
            >
              <Plus className="size-5" />
            </Link>
          ) : undefined
        }
      />
      <div className="container-app">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize whitespace-nowrap border transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground border-primary shadow-card"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {rows === null ? (
            <CardSkeleton />
          ) : visible.length === 0 ? (
            <EmptyHint title={`No ${tab} tasks`} />
          ) : (
            <GroupedByCategory rows={visible} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function GroupedByCategory({ rows }: { rows: RequestRow[] }) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Group by task_type, preserving TASK_TYPES order
  const groups = TASK_TYPES.map((t) => ({
    type: t.value as TaskType,
    label: t.label,
    Icon: t.icon,
    items: rows.filter((r) => r.task_type === t.value),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  const scrollTo = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Summary dashboard */}
      <div className="rounded-2xl bg-card border p-4 shadow-card">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
          Summary
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {groups.map((g) => {
            const Icon = g.Icon;
            return (
              <button
                key={g.type}
                type="button"
                onClick={() => scrollTo(g.type)}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-primary-soft/60 hover:bg-primary-soft p-3 transition-colors active:scale-[0.98]"
              >
                <span className="size-9 grid place-items-center rounded-lg bg-card text-primary">
                  <Icon className="size-4" />
                </span>
                <p className="text-lg font-bold leading-none text-primary">{g.items.length}</p>
                <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                  {g.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped sections */}
      <div className="mt-5 space-y-6">
        {groups.map((g) => {
          const Icon = g.Icon;
          return (
            <section
              key={g.type}
              ref={(el: HTMLElement | null) => {
                sectionRefs.current[g.type] = el as HTMLDivElement | null;
              }}
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="size-7 grid place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-4" />
                </span>
                <h3 className="text-sm font-bold">{g.label}</h3>
                <span className="text-xs text-muted-foreground">({g.items.length})</span>
              </div>
              <div className="space-y-3">
                {g.items.map((r) => (
                  <RequestCard key={r.id} r={r} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
