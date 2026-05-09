import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
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
}

function Feed() {
  const { profile } = useSession();
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [tab, setTab] = useState<"open" | "mine">("open");

  useEffect(() => {
    supabase
      .from("requests")
      .select("*, requester:profiles!requests_requester_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setRows((data ?? []) as RequestRow[]));
  }, []);

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
  const mine = (rows ?? []).filter(
    (r) => r.claimed_by === profile.id || r.requester_id === profile.id,
  );
  const visible = tab === "open" ? open : mine;

  return (
    <AppShell>
      <PageHeader title="Activity" subtitle="Tasks across the community." />
      <div className="container-app">
        <div className="flex gap-2 mb-4">
          {(["open", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border capitalize ${
                tab === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {t === "open" ? "Open" : "My tasks"}
            </button>
          ))}
        </div>
        {rows === null ? (
          <CardSkeleton />
        ) : visible.length === 0 ? (
          <EmptyHint title="Nothing here yet" />
        ) : (
          <div className="space-y-3">
            {visible.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
