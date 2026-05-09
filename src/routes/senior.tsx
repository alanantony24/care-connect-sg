import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { seniors } from "@/lib/mock-data";
import { AlertTriangle, Heart, Phone } from "lucide-react";

export const Route = createFileRoute("/senior")({
  head: () => ({ meta: [{ title: "Senior profile · CareKampung" }] }),
  component: SeniorPage,
});

function SeniorPage() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;
  const senior = seniors[0];

  return (
    <AppShell>
      <Card className="!p-0 overflow-hidden">
        <div className="gradient-warm p-5">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-card grid place-items-center text-4xl shadow-card">{senior.photo}</div>
            <div>
              <h1 className="text-xl font-bold">{senior.name}</h1>
              <p className="text-sm text-foreground/70">{senior.age} years · {senior.language}</p>
              <div className="flex gap-1.5 mt-1.5">
                <Pill tone="primary">{senior.mobility}</Pill>
                <Pill tone={senior.fallRisk === "High" ? "danger" : senior.fallRisk === "Medium" ? "warning" : "success"}>
                  Fall: {senior.fallRisk}
                </Pill>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <SectionTitle title="Medical conditions" />
      <Card>
        <div className="flex flex-wrap gap-2">
          {senior.conditions.map((c) => (
            <Pill key={c} tone="primary">{c}</Pill>
          ))}
          {senior.allergies.length > 0 && senior.allergies.map((a) => (
            <Pill key={a} tone="danger">⚠ {a}</Pill>
          ))}
        </div>
      </Card>

      <SectionTitle title="Care notes" />
      <Card className="border-accent">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Please read before each visit</p>
        <ul className="space-y-2">
          {senior.careNotes.map((n) => (
            <li key={n} className="flex items-start gap-2 text-sm">
              <Heart className="size-4 text-primary shrink-0 mt-0.5" fill="currentColor" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle title="Emergency" />
      <Card className="border-destructive/40 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">Hospital:</span> <span className="font-medium">{senior.preferredHospital}</span></p>
            <p><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{senior.emergencyContact.name}</span> ({senior.emergencyContact.relation})</p>
            <a href={`tel:${senior.emergencyContact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-destructive font-semibold">
              <Phone className="size-4" /> {senior.emergencyContact.phone}
            </a>
          </div>
        </div>
      </Card>

      <SectionTitle title="Wellness preferences" />
      <Card>
        <p className="text-sm">{senior.exercisePref}</p>
      </Card>
    </AppShell>
  );
}
