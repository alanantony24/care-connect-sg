import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui-bits";
import { useSession } from "@/lib/session";
import { taskCategories, seniors } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/requests/new")({
  head: () => ({ meta: [{ title: "New request · CareKampung" }] }),
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/requests" }), 1200);
  };

  if (submitted) {
    return (
      <AppShell>
        <Card className="text-center !p-8">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-semibold">Request posted!</p>
          <p className="text-sm text-muted-foreground mt-1">Verified volunteers in your area have been notified.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to="/requests" className="text-sm text-primary mb-2 inline-block">← Back</Link>
      <h1 className="text-xl font-bold mb-4">New volunteer request</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Senior">
          <select value={seniorId} onChange={(e) => setSeniorId(e.target.value)} className="input">
            {seniors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Category">
          <div className="grid grid-cols-2 gap-2">
            {taskCategories.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-medium text-left transition-colors ${
                  category === c ? "bg-primary/10 border-primary text-primary" : "bg-card text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Date & time">
          <input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </Field>

        <Field label="Duration (minutes)">
          <input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} className="input" />
        </Field>

        <Field label="Location">
          <input required placeholder="e.g. Bishan-AMK Park" value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
        </Field>

        <Field label="Instructions for volunteer">
          <textarea rows={3} placeholder="e.g. Walks slowly, bring water, speaks Hokkien." value={instructions} onChange={(e) => setInstructions(e.target.value)} className="input resize-none" />
        </Field>

        <Card className="bg-warning/10 border-warning/40">
          <p className="text-xs leading-relaxed">
            ⚠ Volunteers cannot administer medication or provide medical care. Restrict tasks to walking, escort, companionship, and grocery support.
          </p>
        </Card>

        <button className="w-full rounded-xl gradient-primary text-primary-foreground font-semibold py-3.5 shadow-elevated mt-2">
          Post request
        </button>
      </form>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:var(--card);padding:0.7rem 0.9rem;font-size:0.875rem;color:var(--foreground);outline:none}.input:focus{border-color:var(--ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--ring) 25%,transparent)}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
