import { createFileRoute, Link, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { taskMeta } from "@/lib/tasks";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ShieldAlert,
  KeyRound,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/requests/$id")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: TaskDetail,
});

interface RequestRow {
  id: string;
  title: string;
  task_type: string;
  location: string;
  date_needed: string;
  time_needed: string;
  notes: string | null;
  status: string;
  created_at: string;
  requester_id: string;
  claimed_by: string | null;
  start_pin: string | null;
  end_pin: string | null;
  requester: { name: string; avatar_url: string | null } | null;
  claimer: { name: string; avatar_url: string | null } | null;
}

function TaskDetail() {
  const { id } = useParams({ from: "/requests/$id" });
  const { profile } = useSession();
  const nav = useNavigate();
  const [r, setR] = useState<RequestRow | null>(null);

  useEffect(() => {
    supabase
      .from("requests")
      .select(
        "*, requester:profiles!requests_requester_id_fkey(name, avatar_url), claimer:profiles!requests_claimed_by_fkey(name, avatar_url)",
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setR(data as RequestRow | null));
  }, [id]);

  if (!r || !profile) {
    return (
      <AppShell hideNav>
        <div className="container-app pt-20 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const meta = taskMeta(r.task_type);
  const Icon = meta.icon;
  const isVolunteer = profile.role === "volunteer";
  const isMine = profile.id === r.requester_id;
  const iClaimed = profile.id === r.claimed_by;
  const ageHours = (Date.now() - new Date(r.created_at).getTime()) / 36e5;
  const urgent = r.status === "open" && ageHours < 12;

  const back = isVolunteer ? "/volunteer" : "/dashboard";

  return (
    <AppShell hideNav>
      <div className="container-app pt-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <Link to={back} className="size-10 grid place-items-center rounded-full bg-card border">
            <ArrowLeft className="size-5" />
          </Link>
          <p className="text-primary font-bold tracking-tight">CareKampung</p>
          <div className="size-10" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {urgent && (
            <span className="rounded-full bg-destructive/10 text-destructive text-xs font-semibold px-3 py-1.5">
              ● High priority
            </span>
          )}
          <span className="rounded-full bg-primary-soft text-primary text-xs font-semibold px-3 py-1.5 capitalize">
            {meta.label}
          </span>
          <span className="rounded-full bg-muted text-muted-foreground text-xs font-semibold px-3 py-1.5 capitalize">
            {r.status.replace("_", " ")}
          </span>
        </div>

        <h1 className="text-3xl font-bold mt-3 leading-tight">{r.title}</h1>

        <div className="mt-5 rounded-2xl bg-card border p-4 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Caregiver</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary-soft text-primary grid place-items-center text-lg font-semibold">
              {r.requester?.name?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="font-semibold">{r.requester?.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground">Requesting help</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-card border shadow-card divide-y">
          <Row icon={<Icon className="size-5" />} label="Task type" text={meta.label} />
          <Row
            icon={<Calendar className="size-5" />}
            label="Date & time"
            text={`${r.date_needed} · ${r.time_needed}`}
          />
          <Row icon={<MapPin className="size-5" />} label="Location" text={r.location} />
          <Row
            icon={<Clock className="size-5" />}
            label="Posted"
            text={`${Math.max(1, Math.round(ageHours))}h ago`}
          />
        </div>

        {r.notes && (
          <div className="mt-4 rounded-2xl bg-muted p-4">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Notes
            </p>
            <p className="mt-2 text-sm leading-6">{r.notes}</p>
          </div>
        )}

        {/* PINs visible to caregiver (the requester) only */}
        {isMine && r.status !== "completed" && (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary-soft/40 p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <p className="text-xs uppercase tracking-wider font-semibold text-primary">
                Your task PINs
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Share these with the volunteer at the start and end of the visit.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <PinBlock label="Start PIN" value={r.start_pin} />
              <PinBlock label="End PIN" value={r.end_pin} />
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-warning/10 border border-warning/40 p-4 flex gap-3">
          <ShieldAlert className="size-5 shrink-0 text-warning-foreground" />
          <p className="text-xs leading-5 text-warning-foreground">
            Volunteers do not handle medical procedures or medications. Call 995 in any emergency.
          </p>
        </div>

        {r.claimer && (
          <div className="mt-4 rounded-2xl bg-card border p-4 shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Volunteer</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="size-12 rounded-full bg-primary-soft text-primary grid place-items-center text-lg font-semibold">
                {r.claimer.name.charAt(0)}
              </div>
              <p className="font-semibold">{r.claimer.name}</p>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-2">
          {isVolunteer && r.status === "open" && (
            <button
              onClick={() => nav({ to: "/requests/$id/start", params: { id } })}
              className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated flex items-center justify-center gap-2"
            >
              <PlayCircle className="size-5" /> Accept & Start with PIN
            </button>
          )}

          {isVolunteer && r.status === "claimed" && iClaimed && (
            <button
              onClick={() => nav({ to: "/requests/$id/start", params: { id } })}
              className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated flex items-center justify-center gap-2"
            >
              <PlayCircle className="size-5" /> Start Task with PIN
            </button>
          )}

          {r.status === "in_progress" && iClaimed && (
            <button
              onClick={() => nav({ to: "/requests/$id/end", params: { id } })}
              className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="size-5" /> End Task with PIN
            </button>
          )}

          {r.status === "completed" && (
            <>
              <div className="rounded-2xl bg-success/15 text-success-foreground border border-success/30 p-4 text-center font-semibold">
                ✅ Task completed — thank you!
              </div>
              <button
                onClick={() => nav({ to: "/requests/$id/review", params: { id } })}
                className="w-full rounded-full bg-card border py-4 font-semibold"
              >
                {isVolunteer ? "Leave caregiver review" : "Review volunteer"}
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function PinBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-card border p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tracking-[0.4em] mt-1 text-primary">{value ?? "----"}</p>
    </div>
  );
}

function Row({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-center gap-4 p-4">
      <span className="size-10 grid place-items-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold truncate">{text}</p>
      </div>
    </div>
  );
}
