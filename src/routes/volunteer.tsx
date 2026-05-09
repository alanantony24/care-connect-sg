import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle, StatCard } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, seniors } from "@/lib/mock-data";
import { ArrowRight, Clock, MapPin, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/volunteer")({
  head: () => ({ meta: [{ title: "Volunteer | CareKampung" }] }),
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
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Volunteer home</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Pick up practical help near you.
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You will only see information needed for the task. Medication and medical procedures
              are out of scope.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <StatCard label="Open" value={open.length} hint="Nearby" tone="warning" />
              <StatCard label="Done" value={47} hint="Tasks" tone="success" />
              <StatCard label="Rating" value="4.9" hint="Verified" />
            </div>
          </div>

          <SectionTitle title="Accepted" />
          {accepted.map((r) => {
            const s = seniors.find((x) => x.id === r.seniorId)!;
            return (
              <Link key={r.id} to="/requests/$id" params={{ id: r.id }} className="block">
                <Card className="border-primary/30">
                  <Pill tone="primary">Today</Pill>
                  <h2 className="mt-3 font-semibold">{r.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.name} |{" "}
                    {new Date(r.datetime).toLocaleTimeString("en-SG", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              </Link>
            );
          })}
        </section>

        <section>
          <SectionTitle title="Open Requests" />
          <div className="grid gap-3">
            {open.map((r) => {
              const s = seniors.find((x) => x.id === r.seniorId)!;
              return (
                <Link key={r.id} to="/requests/$id" params={{ id: r.id }} className="block">
                  <Card className="transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Pill tone="primary">Level {r.level}</Pill>
                          <Pill tone="muted">{r.category}</Pill>
                        </div>
                        <h2 className="mt-3 font-semibold">{r.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          For {s.name}, {s.age} | {s.language}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-4" />
                            {r.durationMin} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-4" />
                            {r.area}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 size-4 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card className="mt-5 bg-accent/60">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-accent-foreground" />
              <p className="text-sm leading-6 text-accent-foreground">
                Stay within the task brief. If anything feels unsafe, call the caregiver or
                emergency services.
              </p>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
