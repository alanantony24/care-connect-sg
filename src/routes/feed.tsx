import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";
import { RequestCard, CardSkeleton, EmptyHint } from "./dashboard";

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
        <div className="border-b flex overflow-x-auto no-scrollbar -mx-1 px-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 min-w-fit px-3 py-3 text-sm font-semibold capitalize border-b-2 transition-colors whitespace-nowrap ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
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
            <div className="space-y-3">
              {visible.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
