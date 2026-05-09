import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle, StatCard } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { appointments, medications, requests, seniors, volunteers } from "@/lib/mock-data";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Footprints,
  Pill as PillIcon,
  Plus,
  UserRoundCheck,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Today | CareKampung" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;
  if (role !== "caregiver") return <Navigate to={role === "volunteer" ? "/volunteer" : "/admin"} />;

  const nextAppointment = appointments[0];
  const appointmentSenior = seniors.find((s) => s.id === nextAppointment.seniorId)!;
  const lowStockMeds = medications.filter((m) => m.remaining <= m.refillAt);
  const openRequests = requests.filter((r) => r.status === "open");
  const acceptedRequest = requests.find((r) => r.status === "accepted");
  const assignedVolunteer = volunteers.find((v) => v.id === acceptedRequest?.acceptedBy);

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Today, 9 May</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Wei Ming, these are the next care actions.
            </h1>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Open help requests"
                value={openRequests.length}
                hint="Needs volunteer"
                tone="warning"
              />
              <StatCard label="Appointments" value={appointments.length} hint="Upcoming" />
              <StatCard
                label="Medicine refill"
                value={lowStockMeds.length}
                hint="Check stock"
                tone={lowStockMeds.length ? "warning" : "success"}
              />
            </div>
          </div>

          <SectionTitle
            title="Most Important"
            action={
              <Link
                to="/requests/new"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" /> Request help
              </Link>
            }
          />
          <Card className="border-primary/30">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <CalendarDays className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{nextAppointment.title}</h2>
                  {nextAppointment.needsEscort && <Pill tone="warning">Escort needed</Pill>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {appointmentSenior.name} at{" "}
                  {new Date(nextAppointment.datetime).toLocaleTimeString("en-SG", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-2 text-sm">{nextAppointment.location}</p>
                {nextAppointment.itemsToBring && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Bring: {nextAppointment.itemsToBring.join(", ")}
                  </p>
                )}
              </div>
              <Link
                to="/schedule"
                className="rounded-md border p-2 text-muted-foreground hover:text-primary"
                aria-label="Open schedule"
              >
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Card>

          <SectionTitle title="Requests" />
          <div className="grid gap-3">
            {requests.slice(0, 3).map((r) => {
              const senior = seniors.find((s) => s.id === r.seniorId)!;
              return (
                <Link key={r.id} to="/requests/$id" params={{ id: r.id }} className="block">
                  <Card className="transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{r.title}</p>
                          <Pill tone={r.status === "open" ? "warning" : "primary"}>{r.status}</Pill>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {senior.name} | {r.area} | Level {r.level}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 size-4 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <aside>
          <SectionTitle title="Safety Handover" />
          <Card className="border-destructive/35 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-destructive shrink-0" />
              <div>
                <p className="font-semibold">Emergency information is ready</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preferred hospital, allergies, and next-of-kin are available from the senior
                  profile.
                </p>
                <Link
                  to="/senior"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-destructive"
                >
                  View profile <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </Card>

          <SectionTitle title="This Week" />
          <Card>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-accent text-accent-foreground grid place-items-center">
                <Footprints className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Walks completed: 5 of 7</p>
                <p className="text-sm text-muted-foreground">
                  Target: four supervised walks weekly
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={`${d}-${i}`} className="text-center">
                  <div
                    className={`h-8 rounded-md border text-xs font-semibold grid place-items-center ${i < 5 ? "bg-accent border-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {i < 5 ? "Done" : ""}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </Card>

          <SectionTitle title="Medication Check" />
          <Card>
            <div className="flex items-start gap-3">
              <PillIcon className="mt-1 size-5 text-primary" />
              <div>
                <p className="font-semibold">Amlodipine has 5 tablets left</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Volunteers can remind only. Caregiver handles medication.
                </p>
              </div>
            </div>
          </Card>

          {assignedVolunteer && (
            <>
              <SectionTitle title="Assigned Volunteer" />
              <Card>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-md bg-secondary grid place-items-center text-sm font-semibold">
                    {assignedVolunteer.photo}
                  </div>
                  <div>
                    <p className="font-semibold">{assignedVolunteer.name}</p>
                    <p className="text-sm text-muted-foreground">{acceptedRequest?.title}</p>
                  </div>
                  <UserRoundCheck className="ml-auto size-5 text-primary" />
                </div>
              </Card>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
