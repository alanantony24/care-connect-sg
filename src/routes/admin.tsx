import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle, StatCard } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, volunteers } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Coordinator | CareKampung" }] }),
  component: AdminHome,
});

function AdminHome() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;
  if (role !== "admin") return <Navigate to={role === "volunteer" ? "/volunteer" : "/dashboard"} />;

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Coordinator overview</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Keep the volunteer network safe and responsive.
            </h1>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatCard
                label="Verified volunteers"
                value={volunteers.length}
                hint="Active"
                tone="success"
              />
              <StatCard
                label="Open requests"
                value={requests.filter((r) => r.status === "open").length}
                hint="Needs match"
                tone="warning"
              />
              <StatCard label="Tasks completed" value={140} hint="This month" />
              <StatCard label="Average rating" value="4.87" hint="Trusted" />
            </div>
          </div>

          <SectionTitle title="Volunteer Checks" />
          <div className="grid gap-3">
            {volunteers.map((v) => (
              <Card key={v.id}>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-md bg-secondary grid place-items-center text-sm font-semibold">
                    {v.photo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{v.name}</p>
                      {v.verified && <Pill tone="success">Verified</Pill>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {v.area} | {v.rating} rating | {v.tasksDone} tasks
                    </p>
                  </div>
                  <button className="rounded-md border px-3 py-2 text-sm font-semibold text-primary">
                    Review
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Recent Requests" />
          <div className="grid gap-3">
            {requests.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.area} | {r.category} | Level {r.level}
                    </p>
                  </div>
                  <Pill
                    tone={
                      r.status === "open"
                        ? "warning"
                        : r.status === "accepted"
                          ? "primary"
                          : "success"
                    }
                  >
                    {r.status}
                  </Pill>
                </div>
              </Card>
            ))}
          </div>

          <SectionTitle title="Emergency Log" />
          <Card>
            <p className="text-sm text-muted-foreground">
              No emergency escalations in the last 30 days.
            </p>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
