import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle, StatCard } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { appointments, medications, requests, seniors, volunteers } from "@/lib/mock-data";
import { AlertTriangle, Calendar, Footprints, Pill as PillIcon, Plus, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Caregiver Home · CareKampung" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;
  if (role !== "caregiver") return <Navigate to={role === "volunteer" ? "/volunteer" : "/admin"} />;

  const todayAppts = appointments.slice(0, 2);
  const lowStockMeds = medications.filter((m) => m.remaining <= m.refillAt);
  const openRequests = requests.filter((r) => r.status === "open");
  const activeVols = volunteers.slice(0, 2);

  return (
    <AppShell>
      <div className="rounded-2xl gradient-primary text-primary-foreground p-5 shadow-elevated">
        <p className="text-xs opacity-80 font-medium">Good morning, Wei Ming</p>
        <h1 className="text-xl font-bold mt-1">Here's the care plan today</h1>
        <p className="text-sm opacity-90 mt-1">2 appointments · 1 volunteer arriving · 3 meds</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <StatCard label="Today" value={todayAppts.length} hint="Appts" />
        <StatCard label="Volunteers" value={activeVols.length} hint="Active" tone="success" />
        <StatCard label="Refill" value={lowStockMeds.length} hint="Low" tone="warning" />
      </div>

      <Card className="mt-4 !p-4 border-destructive/40 bg-destructive/5">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-destructive/15 text-destructive grid place-items-center shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Emergency contacts ready</p>
            <p className="text-xs text-muted-foreground mt-0.5">SCDF 995 · Tan Tock Seng Hospital · Son: 9123 4567</p>
          </div>
          <button className="rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold px-3 py-2">SOS</button>
        </div>
      </Card>

      <SectionTitle
        title="Today's appointments"
        action={<Link to="/schedule" className="text-xs font-medium text-primary">View all</Link>}
      />
      <div className="space-y-2.5">
        {todayAppts.map((a) => {
          const senior = seniors.find((s) => s.id === a.seniorId)!;
          return (
            <Card key={a.id} className="!p-3.5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-accent text-accent-foreground grid place-items-center text-xl">
                  {a.type === "Dialysis" ? "🩺" : a.type === "Physiotherapy" ? "🦵" : "🏥"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{a.title}</p>
                    {a.needsEscort && <Pill tone="primary">Escort</Pill>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {senior.name} · {new Date(a.datetime).toLocaleString("en-SG", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">📍 {a.location}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle
        title="Volunteer requests"
        action={
          <Link to="/requests/new" className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <Plus className="size-3.5" /> New
          </Link>
        }
      />
      <div className="space-y-2.5">
        {openRequests.slice(0, 2).map((r) => (
          <Link to="/requests/$id" params={{ id: r.id }} key={r.id} className="block">
            <Card className="!p-3.5 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <Users className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.area} · {r.durationMin}min</p>
                </div>
                <Pill tone="warning">Open</Pill>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <SectionTitle title="Wellness this week" />
      <Card>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-success/15 text-success-foreground grid place-items-center">
            <Footprints className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Morning walks</p>
            <p className="text-xs text-muted-foreground">5 of 7 days · 3-day streak 🔥</p>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className={`h-8 rounded-md grid place-items-center text-[10px] font-semibold ${
                  i < 5 ? "bg-success/30 text-success-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i < 5 ? "✓" : ""}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle title="Medications" />
      <div className="space-y-2.5">
        {medications.slice(0, 3).map((m) => {
          const senior = seniors.find((s) => s.id === m.seniorId)!;
          const low = m.remaining <= m.refillAt;
          return (
            <Card key={m.id} className="!p-3.5">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-xl grid place-items-center ${low ? "bg-warning/25 text-warning-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  <PillIcon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.name} · {m.dosage}</p>
                  <p className="text-xs text-muted-foreground">{senior.name} · {m.timing} · {m.food === "any" ? "anytime" : `${m.food} food`}</p>
                </div>
                {low ? <Pill tone="warning">{m.remaining} left</Pill> : <Pill tone="success">{m.remaining}</Pill>}
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle title="Active volunteers" />
      <div className="space-y-2.5">
        {activeVols.map((v) => (
          <Card key={v.id} className="!p-3.5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-secondary grid place-items-center text-xl">{v.photo}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm">{v.name}</p>
                  {v.verified && <span className="text-primary text-xs">✓</span>}
                </div>
                <p className="text-xs text-muted-foreground">⭐ {v.rating} · {v.tasksDone} tasks · {v.area}</p>
              </div>
              <Calendar className="size-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-8 leading-relaxed">
        CareKampung is not a replacement for professional medical care.
      </p>
    </AppShell>
  );
}
