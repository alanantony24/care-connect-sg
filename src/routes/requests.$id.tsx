import { createFileRoute, Link, Navigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { requests, seniors, volunteers } from "@/lib/mock-data";
import { Calendar, MapPin, Clock, Heart, AlertTriangle, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({ meta: [{ title: "Request · CareKampung" }] }),
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
  if (!r) return (
    <AppShell>
      <Card><p className="text-sm">Request not found.</p><Link to="/requests" className="text-primary text-sm">Back</Link></Card>
    </AppShell>
  );

  const senior = seniors.find((s) => s.id === r.seniorId)!;
  const volunteer = r.acceptedBy ? volunteers.find((v) => v.id === r.acceptedBy) : null;
  const isVolunteer = role === "volunteer";

  return (
    <AppShell>
      <Link to={isVolunteer ? "/volunteer" : "/requests"} className="text-sm text-primary mb-2 inline-block">← Back</Link>

      <Card className="!p-0 overflow-hidden">
        <div className="gradient-warm p-5">
          <Pill tone="primary">{r.category}</Pill>
          <h1 className="text-lg font-bold mt-2">{r.title}</h1>
          <div className="space-y-1.5 mt-3 text-sm">
            <div className="flex items-center gap-2"><Calendar className="size-4 text-primary" />{new Date(r.datetime).toLocaleString("en-SG", { dateStyle: "full", timeStyle: "short" })}</div>
            <div className="flex items-center gap-2"><Clock className="size-4 text-primary" />{r.durationMin} minutes</div>
            <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" />{r.location}</div>
          </div>
        </div>
      </Card>

      <SectionTitle title="Senior" />
      <Card>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-secondary grid place-items-center text-2xl">{senior.photo}</div>
          <div>
            <p className="font-semibold">{senior.name}</p>
            <p className="text-xs text-muted-foreground">{senior.age} · {senior.language} · {senior.mobility}</p>
          </div>
        </div>
      </Card>

      <SectionTitle title="Care notes" />
      <Card className="border-accent">
        <ul className="space-y-2">
          {senior.careNotes.map((n) => (
            <li key={n} className="flex items-start gap-2 text-sm">
              <Heart className="size-4 text-primary shrink-0 mt-0.5" fill="currentColor" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">Instructions: {r.instructions}</p>
      </Card>

      <Card className="mt-3 border-warning/50 bg-warning/10">
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="size-4 text-warning-foreground shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            <strong>Safety reminder:</strong> Volunteers must NOT administer medication, give injections, or perform medical procedures. Call 995 in any emergency.
          </p>
        </div>
      </Card>

      {volunteer && !isVolunteer && (
        <>
          <SectionTitle title="Accepted by" />
          <Card>
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-secondary grid place-items-center text-xl">{volunteer.photo}</div>
              <div className="flex-1">
                <p className="font-medium">{volunteer.name} {volunteer.verified && <span className="text-primary">✓</span>}</p>
                <p className="text-xs text-muted-foreground">⭐ {volunteer.rating} · {volunteer.tasksDone} tasks</p>
              </div>
            </div>
          </Card>
        </>
      )}

      <div className="mt-6 space-y-2.5">
        {isVolunteer && r.status === "open" && !accepted && (
          <button
            onClick={() => setAccepted(true)}
            className="w-full rounded-xl gradient-primary text-primary-foreground font-semibold py-3.5 shadow-elevated active:scale-[0.99] transition-transform"
          >
            Accept this request
          </button>
        )}
        {isVolunteer && accepted && (
          <Card className="border-success/50 bg-success/10 text-center">
            <p className="font-semibold text-success-foreground">✓ Task accepted</p>
            <p className="text-xs text-muted-foreground mt-1">Caregiver has been notified</p>
          </Card>
        )}

        {!isVolunteer && !completed && (
          <button
            onClick={() => setCompleted(true)}
            className="w-full rounded-xl bg-success text-success-foreground font-semibold py-3.5 active:scale-[0.99] transition-transform"
          >
            Mark as completed
          </button>
        )}
        {!isVolunteer && completed && (
          <Card>
            <p className="font-medium text-sm mb-2">Rate the volunteer</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className="p-1">
                  <Star className={`size-7 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-xs text-success-foreground mt-2">Thanks! Your feedback helps the community 💚</p>}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
