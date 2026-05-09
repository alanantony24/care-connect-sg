import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Pill } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { taskCategories, seniors } from "@/lib/mock-data";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/requests/new")({
  head: () => ({ meta: [{ title: "New request | CareKampung" }] }),
  component: NewRequest,
});

function NewRequest() {
  const { role } = useSession();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>(taskCategories[0]);
  const [seniorId, setSeniorId] = useState(seniors[0].id);
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!role) return <Navigate to="/" />;
  if (role === "volunteer") return <Navigate to="/volunteer" />;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/requests" }), 1000);
  };

  if (submitted) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-3 size-10 text-primary" />
          <p className="font-semibold">Request posted</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified volunteers near the task location can now review it.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/requests"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New help request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe one clear task. Keep medical work out of scope.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-4">
          <Field label="Senior">
            <select
              value={seniorId}
              onChange={(e) => setSeniorId(e.target.value)}
              className="input"
            >
              {seniors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Task type">
            <div className="grid gap-2 sm:grid-cols-2">
              {taskCategories.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-md border px-3 py-3 text-left text-sm font-medium transition-colors ${
                    category === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "bg-card text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date and time">
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Duration">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input"
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="300">5 hours</option>
              </select>
            </Field>
          </div>

          <Field label="Meeting point">
            <input
              required
              placeholder="e.g. Bishan-AMK Park, Entrance C"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="What the volunteer should know">
            <textarea
              rows={4}
              placeholder="Keep it practical: pace, language, items to bring, who to call."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="input resize-none"
            />
          </Field>

          <Card className="bg-warning/10 border-warning/40">
            <div className="flex flex-wrap gap-2">
              <Pill tone="warning">Boundary</Pill>
              <Pill tone="muted">No medication administration</Pill>
              <Pill tone="muted">No medical procedures</Pill>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Volunteers may remind, accompany, and observe. They should call the caregiver if
              anything changes.
            </p>
          </Card>

          <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">
            Post request
          </button>
        </form>
      </div>

      <style>{`.input{width:100%;border-radius:0.375rem;border:1px solid var(--border);background:var(--card);padding:0.75rem 0.875rem;font-size:0.875rem;color:var(--foreground);outline:none}.input:focus{border-color:var(--ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--ring) 18%,transparent)}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
