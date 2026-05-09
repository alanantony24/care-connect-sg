import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { appointments, seniors } from "@/lib/mock-data";

export const Route = createFileRoute("/schedule")({
  head: () => ({ meta: [{ title: "Schedule · CareKampung" }] }),
  component: SchedulePage,
});

function SchedulePage() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, a) => {
    const key = new Date(a.datetime).toLocaleDateString("en-SG", { weekday: "long", month: "short", day: "numeric" });
    (acc[key] ||= []).push(a);
    return acc;
  }, {});

  return (
    <AppShell>
      <h1 className="text-xl font-bold">Schedule</h1>
      <p className="text-sm text-muted-foreground">Upcoming appointments & wellness</p>

      {Object.entries(grouped).map(([day, list]) => (
        <div key={day}>
          <SectionTitle title={day} />
          <div className="space-y-2.5">
            {list.map((a) => {
              const s = seniors.find((x) => x.id === a.seniorId)!;
              return (
                <Card key={a.id}>
                  <div className="flex items-start gap-3">
                    <div className="text-center shrink-0">
                      <p className="text-xs text-muted-foreground">{new Date(a.datetime).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                    <div className="w-px self-stretch bg-border" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{a.title}</p>
                        <Pill tone="primary">{a.type}</Pill>
                        {a.needsEscort && <Pill tone="warning">Escort</Pill>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.name} · {a.location}</p>
                      {a.itemsToBring && (
                        <p className="text-xs text-muted-foreground mt-1.5">🎒 {a.itemsToBring.join(", ")}</p>
                      )}
                      {a.notes && <p className="text-xs mt-1.5">{a.notes}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </AppShell>
  );
}
