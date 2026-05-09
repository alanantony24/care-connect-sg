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
  claimed_by: string | null;
  requester_id: string;
  requester?: { name: string } | null;
  claimer?: { name: string } | null;
}

const TABS = ["pending", "accepted", "completed"] as const;
type Tab = (typeof TABS)[number];

function Feed() {
  const { profile } = useSession();
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [tab, setTab] = useState<Tab>("pending");

  useEffect(() => {
    if (!profile) return;
    const q = supabase
      .from("requests")
      .select(
        "*, requester:profiles!requests_requester_id_fkey(name), claimer:profiles!requests_claimed_by_fkey(name)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    const filtered =
      profile.role === "caregiver"
        ? q.eq("requester_id", profile.id)
        : q.or(`status.eq.open,claimed_by.eq.${profile.id}`);
    filtered.then(({ data }) => setRows((data ?? []) as RequestRow[]));
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
  const buckets: Record<Tab, RequestRow[]> = {
    pending: list.filter((r) => r.status === "open"),
    accepted: list.filter((r) => r.status === "claimed"),
    completed: list.filter((r) => r.status === "completed"),
  };
  const visible = buckets[tab];

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
        <div className="border-b flex">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
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
