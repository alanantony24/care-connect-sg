import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Info, Loader2, Send } from "lucide-react";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { FeeReceipt } from "@/components/FeeReceipt";
import { LocationPicker, type PickedLocation } from "@/components/LocationPicker";
import { SENIORS } from "@/lib/seniors";
import {
  MAX_TASK_PAYMENT,
  TASK_TYPES,
  clampTaskPayment,
  paymentGuidance,
  platformFeeFor,
  taskBadgeStyle,
  volunteerPayoutFor,
  type TaskType,
} from "@/lib/tasks";
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
  const [seniorId, setSeniorId] = useState<string>(SENIORS[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("0");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [busy, setBusy] = useState(false);
  const suggestedPayment = paymentGuidance(taskType);
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, []);
  const paymentInputRef = useRef<HTMLInputElement>(null);
  const paymentValue = clampTaskPayment(Number(payment) || 0);
  const platformFee = platformFeeFor(paymentValue);
  const volunteerPayout = volunteerPayoutFor(paymentValue);

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
    if (!location) return toast.error("Please pick a location on the map");
    setBusy(true);
    const { error } = await supabase.from("requests").insert({
      title,
      task_type: taskType,
      date_needed: date,
      time_needed: time,
      location: location.label,
      notes: notes || null,
      payment_amount: clampTaskPayment(Number(payment) || 0),
      priority,
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

        {SENIORS.length > 1 && (
          <Field label="Care recipient">
            <select
              required
              value={seniorId}
              onChange={(e) => setSeniorId(e.target.value)}
              className="kinput"
            >
              {SENIORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.relation}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div>
          <span className="block text-sm font-medium mb-2">Task type</span>
          <div className="grid grid-cols-3 gap-2">
            {TASK_TYPES.map((t) => {
              const Icon = t.icon;
              const style = taskBadgeStyle(t.value);
              const active = taskType === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTaskType(t.value)}
                  className={`relative overflow-hidden flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-transform active:scale-[0.98] ${
                    active ? style.glass : "bg-card text-muted-foreground"
                  }`}
                >
                  {active && (
                    <span
                      className={`absolute -right-5 -top-6 size-16 rounded-full ${style.glow} blur-2xl`}
                    />
                  )}
                  <span
                    className={`relative size-9 grid place-items-center rounded-xl ${
                      active ? style.icon : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={2.3} />
                  </span>
                  <span className={`relative text-xs font-medium ${active ? "text-white/80" : ""}`}>
                    {t.label}
                  </span>
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
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="kinput"
            />
          </Field>
          <Field label="Time">
            <input
              required
              type="time"
              step={300}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="kinput"
            />
          </Field>
        </div>

        <div>
          <span className="block text-sm font-medium mb-1.5">Location / meeting point</span>
          <LocationPicker
            value={location}
            onChange={setLocation}
            placeholder="Search address, MRT or postal code"
          />
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">Priority</span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  v: "low",
                  label: "Low",
                  hint: "Flexible",
                  active:
                    "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  dot: "bg-emerald-500",
                },
                {
                  v: "normal",
                  label: "Normal",
                  hint: "Standard",
                  active:
                    "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  dot: "bg-amber-500",
                },
                {
                  v: "high",
                  label: "High",
                  hint: "Urgent",
                  active: "border-red-500 bg-red-500/10 text-red-600 dark:text-red-300",
                  dot: "bg-red-500",
                },
              ] as const
            ).map((p) => {
              const active = priority === p.v;
              return (
                <button
                  type="button"
                  key={p.v}
                  onClick={() => setPriority(p.v)}
                  className={`rounded-2xl border p-3 text-left transition-colors ${
                    active ? p.active : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${p.dot}`} />
                    <p className="text-sm font-semibold">{p.label}</p>
                  </div>
                  <p className="text-xs opacity-80 mt-1">{p.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

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
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  We cap all tasks at S${MAX_TASK_PAYMENT} during this pilot.
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
              max={MAX_TASK_PAYMENT}
              step={1}
              value={payment}
              onChange={(e) => setPayment(String(clampTaskPayment(Number(e.target.value) || 0)))}
              className="kinput kinput-money"
              placeholder="10"
            />
          </div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <FeeReceipt
              amount={paymentValue}
              fee={platformFee}
              payout={volunteerPayout}
              amountLabel="You set"
            />
            <p>
              Held securely while the task is in progress and released when the volunteer enters
              your end PIN.
            </p>
          </div>
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
