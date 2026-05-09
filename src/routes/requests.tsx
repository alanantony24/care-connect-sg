import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, seniors } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Requests · CareKampung" }] }),
  component: RequestsList,
});

function RequestsList() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;

  return (
    <AppShell>
      <SectionTitle
        title="Volunteer requests"
        action={
          <Link to="/requests/new" className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5">
            <Plus className="size-3.5" /> New
          </Link>
        }
      />
      <div className="space-y-2.5">
        {requests.map((r) => {
          const senior = seniors.find((s) => s.id === r.seniorId)!;
          return (
            <Link key={r.id} to="/requests/$id" params={{ id: r.id }} className="block">
              <Card className="!p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-xl bg-accent text-accent-foreground grid place-items-center text-xl">
                    {r.category === "Exercise accompaniment" ? "🚶" :
                     r.category === "Appointment escort" ? "🚐" :
                     r.category === "Grocery assistance" ? "🛒" :
                     r.category === "Companionship" ? "☕" : "💊"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">{r.title}</p>
                      <Pill tone={r.status === "open" ? "warning" : r.status === "accepted" ? "primary" : "success"}>
                        {r.status}
                      </Pill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {senior.name} · {new Date(r.datetime).toLocaleString("en-SG", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">📍 {r.location} · {r.durationMin}min</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
