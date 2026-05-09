import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { appointments, seniors } from "@/lib/mock-data";

export const Route = createFileRoute("/schedule")({
  head: () => ({ meta: [{ title: "Visits | CareKampung" }] }),
  component: SchedulePage,
});

function SchedulePage() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, a) => {
    const key = new Date(a.datetime).toLocaleDateString("en-SG", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    (acc[key] ||= []).push(a);
    return acc;
  }, {});

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Visits and appointments</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Only show what someone needs to prepare or accompany safely.
      </p>

      {Object.entries(grouped).map(([day, list]) => (
        <section key={day}>
          <SectionTitle title={day} />
          <div className="grid gap-3">
            {list.map((a) => {
              const s = seniors.find((x) => x.id === a.seniorId)!;
              return (
                <Card key={a.id}>
                  <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                    <div>
                      <p className="font-semibold">
                        {new Date(a.datetime).toLocaleTimeString("en-SG", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.name}</p>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{a.title}</h2>
                        <Pill tone="primary">{a.type}</Pill>
                        {a.needsEscort && <Pill tone="warning">Escort</Pill>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{a.location}</p>
                      {a.itemsToBring && (
                        <p className="mt-2 text-sm">Bring: {a.itemsToBring.join(", ")}</p>
                      )}
                      {a.notes && <p className="mt-2 text-sm text-muted-foreground">{a.notes}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
