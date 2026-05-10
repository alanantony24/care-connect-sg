import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Info, Loader2, Send } from "lucide-react";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { TASK_TYPES, paymentGuidance, type TaskType } from "@/lib/tasks";
import { toast } from "sonner";
import { Style } from "./login";

export const Route = createFileRoute("/requests/new")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: NewRequest,
});

function NewRequest() {
  const { profile } = useSession();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("grocery");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("10");
  const [busy, setBusy] = useState(false);
  const suggestedPayment = paymentGuidance(taskType);
  const paymentInputRef = useRef<HTMLInputElement>(null);

  const useSuggestedPayment = () => {
    const amount = String(suggestedPayment.amount);
    setPayment(amount);
    if (paymentInputRef.current) {
      paymentInputRef.current.value = amount;
      paymentInputRef.current.focus();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("requests").insert({
      title,
      task_type: taskType,
      date_needed: date,
      time_needed: time,
      location,
      notes: notes || null,
      payment_amount: Number(payment) || 0,
      requester_id: profile.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);

    await supabase
      .from("profiles")
      .update({ tasks_received: profile.tasks_received + 1 })
      .eq("id", profile.id);

    toast.success("Request posted!");
    nav({ to: profile.role === "volunteer" ? "/volunteer" : "/dashboard" });
  };

  return (
    <div className="min-h-screen container-app pt-6 pb-10">
      <div className="flex items-center justify-between mb-3">
        <Link
          to="/dashboard"
          className="size-10 grid place-items-center rounded-full bg-card border"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-primary font-bold tracking-tight">Komunity</p>
        <div className="size-10" />
      </div>

      <h1 className="text-3xl font-bold mt-4">Request a Volunteer</h1>
      <p className="mt-1 text-muted-foreground">
        Tell us what you need. Keep medical procedures out of scope — volunteers can accompany,
        carry, and assist only.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Task title">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="kinput"
            placeholder="e.g. Weekly grocery run"
          />
        </Field>

        <div>
          <span className="block text-sm font-medium mb-2">Task type</span>
          <div className="grid grid-cols-3 gap-2">
            {TASK_TYPES.map((t) => {
              const Icon = t.icon;
              const active = taskType === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTaskType(t.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-colors ${
                    active ? "border-primary bg-primary-soft" : "bg-card"
                  }`}
                >
                  <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="kinput"
            />
          </Field>
          <Field label="Time">
            <input
              required
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="kinput"
            />
          </Field>
        </div>

        <Field label="Location / meeting point">
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="kinput"
            placeholder="e.g. Block 102, Ang Mo Kio Ave 3"
          />
        </Field>

        <Field label="Notes for volunteers">
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="kinput resize-none"
            placeholder="Any specific instructions or accessibility needs."
          />
        </Field>

        <Field label="Payment offered (SGD)">
          <div className="mb-3 rounded-2xl border border-primary/25 bg-primary-soft/40 p-4">
            <div className="flex items-start gap-3">
              <span className="size-9 shrink-0 rounded-full bg-card text-primary grid place-items-center">
                <Info className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Suggested amount: S${suggestedPayment.amount} ({suggestedPayment.range})
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {suggestedPayment.reason}
                </p>
                <button
                  type="button"
                  onClick={useSuggestedPayment}
                  className="mt-3 text-xs font-semibold text-primary"
                >
                  Use suggested amount
                </button>
              </div>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
              S$
            </span>
            <input
              ref={paymentInputRef}
              required
              type="number"
              min={0}
              step={1}
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="kinput kinput-money"
              placeholder="10"
            />
          </div>
          <span className="block text-xs text-muted-foreground mt-1.5">
            Held securely while the task is in progress and released to the volunteer when they
            enter your end PIN.
          </span>
        </Field>

        <button
          disabled={busy}
          className="w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Post request
        </button>
      </form>
      <Style />
      <style>{`.kinput-money{padding-left:2.9rem!important;}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </div>
  );
}
