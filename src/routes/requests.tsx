import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, seniors } from "@/lib/mock-data";
import { ArrowRight, Plus } from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Help requests | CareKampung" }] }),
  component: RequestsList,
});

function RequestsList() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Help requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Simple, low-risk tasks that a trusted volunteer can take.
          </p>
        </div>
        {role !== "volunteer" && (
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> New
          </Link>
        )}
      </div>

      <SectionTitle title="All Requests" />
      <div className="grid gap-3 lg:grid-cols-2">
        {requests.map((r) => {
          const senior = seniors.find((s) => s.id === r.seniorId)!;
          return (
            <Link key={r.id} to="/requests/$id" params={{ id: r.id }} className="block">
              <Card className="h-full transition-colors hover:border-primary/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="primary">{r.category}</Pill>
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
                    <h2 className="mt-3 font-semibold">{r.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {senior.name} | {r.area} | {r.durationMin} min
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {new Date(r.datetime).toLocaleString("en-SG", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
