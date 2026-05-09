import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle, StatCard } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, seniors } from "@/lib/mock-data";
import { MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/volunteer")({
  head: () => ({ meta: [{ title: "Volunteer · CareKampung" }] }),
  component: VolunteerHome,
});

function VolunteerHome() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;
  if (role !== "volunteer") return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} />;

  const open = requests.filter((r) => r.status === "open");
  const accepted = requests.filter((r) => r.status === "accepted");

  return (
    <AppShell>
      <div className="rounded-2xl gradient-primary text-primary-foreground p-5 shadow-elevated">
        <p className="text-xs opacity-80 font-medium">Welcome back, Aisha</p>
        <h1 className="text-xl font-bold mt-1">Help your kampung today 💚</h1>
        <p className="text-sm opacity-90 mt-1">{open.length} open requests near you</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <StatCard label="Tasks" value={47} hint="Done" tone="success" />
        <StatCard label="Rating" value="4.9" hint="⭐" tone="primary" />
        <StatCard label="Streak" value="12" hint="Weeks" />
      </div>

      <SectionTitle title="My accepted tasks" />
      {accepted.length === 0 ? (
        <Card><p className="text-sm text-muted-foreground">No accepted tasks yet.</p></Card>
      ) : (
        <div className="space-y-2.5">
          {accepted.map((r) => {
            const s = seniors.find((x) => x.id === r.seniorId)!;
            return (
              <Link key={r.id} to="/requests/$id" params={{ id: r.id }} className="block">
                <Card className="!p-3.5 border-primary/40">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <Pill tone="primary">Today</Pill>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.name} · {new Date(r.datetime).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <SectionTitle title="Nearby open requests" />
      <div className="space-y-2.5">
        {open.map((r) => {
          const s = seniors.find((x) => x.id === r.seniorId)!;
          return (
            <Link key={r.id} to="/requests/$id" params={{ id: r.id }} className="block">
              <Card className="!p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <Pill tone="primary">{r.category}</Pill>
                  <Pill tone="warning">{r.area}</Pill>
                </div>
                <p className="font-semibold text-sm mt-2">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">For {s.name} ({s.age}) · {s.language}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" />{r.durationMin}min</span>
                  <span className="flex items-center gap-1 truncate"><MapPin className="size-3.5" />{r.location}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-8 leading-relaxed">
        You agree to follow CareKampung community guidelines. No medication or medical procedures.
      </p>
    </AppShell>
  );
}
