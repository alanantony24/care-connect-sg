import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle, StatCard } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, volunteers } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · CareKampung" }] }),
  component: AdminHome,
});

function AdminHome() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;
  if (role !== "admin") return <Navigate to={role === "volunteer" ? "/volunteer" : "/dashboard"} />;

  return (
    <AppShell>
      <div className="rounded-2xl gradient-primary text-primary-foreground p-5 shadow-elevated">
        <p className="text-xs opacity-80 font-medium">Coordinator dashboard</p>
        <h1 className="text-xl font-bold mt-1">Community health</h1>
        <p className="text-sm opacity-90 mt-1">All systems calm. No active escalations.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <StatCard label="Active vols" value={volunteers.length} hint="Verified" tone="success" />
        <StatCard label="Open req" value={requests.filter(r => r.status === "open").length} hint="This week" tone="warning" />
        <StatCard label="Tasks done" value={140} hint="Month" />
        <StatCard label="Avg rating" value="4.87" hint="⭐" tone="primary" />
      </div>

      <SectionTitle title="Volunteer applications" />
      <div className="space-y-2.5">
        {volunteers.map((v) => (
          <Card key={v.id} className="!p-3.5">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-secondary grid place-items-center text-xl">{v.photo}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm">{v.name}</p>
                  {v.verified && <Pill tone="success">Verified</Pill>}
                </div>
                <p className="text-xs text-muted-foreground">{v.area} · ⭐ {v.rating} · {v.tasksDone} tasks</p>
              </div>
              <button className="text-xs font-semibold text-primary">Review</button>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle title="Recent requests" />
      <div className="space-y-2.5">
        {requests.map((r) => (
          <Card key={r.id} className="!p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.area} · {r.category}</p>
              </div>
              <Pill tone={r.status === "open" ? "warning" : r.status === "accepted" ? "primary" : "success"}>{r.status}</Pill>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle title="Emergency log" />
      <Card>
        <p className="text-sm text-muted-foreground">No emergencies in the last 30 days. ✨</p>
      </Card>
    </AppShell>
  );
}
