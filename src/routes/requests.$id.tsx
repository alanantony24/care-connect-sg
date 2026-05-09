import { createFileRoute, Link, Navigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, seniors, volunteers } from "@/lib/mock-data";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({ meta: [{ title: "Request | CareKampung" }] }),
  component: RequestDetail,
});

function RequestDetail() {
  const { role } = useSession();
  const { id } = useParams({ from: "/requests/$id" });
  const [accepted, setAccepted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rating, setRating] = useState(0);

  if (!role) return <Navigate to="/" />;
  const r = requests.find((x) => x.id === id);
  if (!r)
    return (
      <AppShell>
        <Card>
          <p className="text-sm">Request not found.</p>
          <Link to="/requests" className="text-primary text-sm">
            Back
          </Link>
        </Card>
      </AppShell>
    );

  const senior = seniors.find((s) => s.id === r.seniorId)!;
  const volunteer = r.acceptedBy ? volunteers.find((v) => v.id === r.acceptedBy) : null;
  const isVolunteer = role === "volunteer";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Link
          to={isVolunteer ? "/volunteer" : "/requests"}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <Card className="border-primary/25">
          <div className="flex flex-wrap gap-2">
            <Pill tone="primary">Level {r.level}</Pill>
            <Pill tone="muted">{r.category}</Pill>
            <Pill tone={r.status === "open" ? "warning" : "primary"}>{r.status}</Pill>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{r.title}</h1>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <Info
              icon={<Calendar className="size-4" />}
              text={new Date(r.datetime).toLocaleString("en-SG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            />
            <Info icon={<Clock className="size-4" />} text={`${r.durationMin} minutes`} />
            <Info icon={<MapPin className="size-4" />} text={r.location} />
          </div>
        </Card>

        <SectionTitle title="Task Handover" />
        <Card>
          <p className="text-sm font-semibold">For {senior.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {senior.age} years | {senior.language} | {senior.mobility}
          </p>
          <p className="mt-4 text-sm leading-6">{r.instructions}</p>
        </Card>

        <SectionTitle title="Care Notes" />
        <Card>
          <ul className="space-y-3">
            {senior.careNotes.map((n) => (
              <li key={n} className="flex gap-3 text-sm leading-6">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mt-4 border-warning/50 bg-warning/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
            <p className="text-sm leading-6">
              Volunteers must not administer medication, give injections, or perform medical
              procedures. Call 995 for emergencies.
            </p>
          </div>
        </Card>

        {volunteer && !isVolunteer && (
          <>
            <SectionTitle title="Accepted By" />
            <Card>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-md bg-secondary grid place-items-center text-sm font-semibold">
                  {volunteer.photo}
                </div>
                <div>
                  <p className="font-semibold">{volunteer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {volunteer.rating} rating | {volunteer.tasksDone} tasks
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="mt-6">
          {isVolunteer && r.status === "open" && !accepted && (
            <button
              onClick={() => setAccepted(true)}
              className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              Accept request
            </button>
          )}
          {isVolunteer && accepted && (
            <Card className="border-success/50 bg-accent">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-accent-foreground" />
                <p className="font-semibold text-accent-foreground">
                  Task accepted. Caregiver has been notified.
                </p>
              </div>
            </Card>
          )}

          {!isVolunteer && !completed && (
            <button
              onClick={() => setCompleted(true)}
              className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              Mark completed
            </button>
          )}
          {!isVolunteer && completed && (
            <Card>
              <p className="mb-3 font-semibold">Rate the volunteer</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className="rounded-md border p-2"
                    aria-label={`Rate ${n}`}
                  >
                    <Star
                      className={`size-5 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Thanks. Your feedback helps keep the volunteer pool trusted.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  );
}
