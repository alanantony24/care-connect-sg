import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill, SectionTitle } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { seniors } from "@/lib/mock-data";
import { AlertTriangle, Phone, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/senior")({
  head: () => ({ meta: [{ title: "Senior profile | CareKampung" }] }),
  component: SeniorPage,
});

function SeniorPage() {
  const { role } = useSession();
  if (!role) return <Navigate to="/" />;
  const senior = seniors[0];

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section>
          <Card>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-lg bg-primary text-primary-foreground grid place-items-center text-lg font-semibold">
                {senior.photo}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{senior.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {senior.age} years | {senior.language}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="primary">{senior.mobility}</Pill>
                  <Pill
                    tone={
                      senior.fallRisk === "High"
                        ? "danger"
                        : senior.fallRisk === "Medium"
                          ? "warning"
                          : "success"
                    }
                  >
                    Fall risk: {senior.fallRisk}
                  </Pill>
                </div>
              </div>
            </div>
          </Card>

          <SectionTitle title="Safe To Share" />
          <Card>
            <div className="flex flex-wrap gap-2">
              {senior.safeToShare.map((item) => (
                <Pill key={item}>{item}</Pill>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Volunteers see task-relevant context only. Caregiver retains full medical control.
            </p>
          </Card>

          <SectionTitle title="Conditions" />
          <Card>
            <div className="flex flex-wrap gap-2">
              {senior.conditions.map((c) => (
                <Pill key={c} tone="primary">
                  {c}
                </Pill>
              ))}
              {senior.allergies.map((a) => (
                <Pill key={a} tone="danger">
                  Allergy: {a}
                </Pill>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle title="Before Each Visit" />
          <Card className="border-primary/25">
            <ul className="space-y-3">
              {senior.careNotes.map((note) => (
                <li key={note} className="flex gap-3 text-sm leading-6">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </Card>

          <SectionTitle title="Emergency" />
          <Card className="border-destructive/35 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Preferred hospital:</span>{" "}
                  <span className="font-semibold">{senior.preferredHospital}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Next-of-kin:</span>{" "}
                  <span className="font-semibold">{senior.emergencyContact.name}</span> (
                  {senior.emergencyContact.relation})
                </p>
                <a
                  href={`tel:${senior.emergencyContact.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 font-semibold text-destructive-foreground"
                >
                  <Phone className="size-4" /> {senior.emergencyContact.phone}
                </a>
              </div>
            </div>
          </Card>

          <SectionTitle title="Wellness Preference" />
          <Card>
            <p className="text-sm leading-6">{senior.exercisePref}</p>
            <p className="mt-3 text-sm text-muted-foreground">{senior.address}</p>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
