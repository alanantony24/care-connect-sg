import { createFileRoute, Link, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { taskMeta } from "@/lib/tasks";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, MapPin, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { checkBadgesOnClaim, checkBadgesOnComplete } from "@/lib/badges";

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
  requester: { name: string; avatar_url: string | null } | null;
  claimer: { name: string; avatar_url: string | null } | null;
}

function TaskDetail() {
  const { id } = useParams({ from: "/requests/$id" });
  const { profile, refresh } = useSession();
  const nav = useNavigate();
  const [r, setR] = useState<RequestRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("requests")
      .select(
        "*, requester:profiles!requests_requester_id_fkey(name, avatar_url), claimer:profiles!requests_claimed_by_fkey(name, avatar_url)",
      )
      .eq("id", id)
      .maybeSingle();
    setR(data as RequestRow | null);
  };

  useEffect(() => {
    load();
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

  const claim = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("requests")
      .update({ claimed_by: profile.id, status: "claimed" })
      .eq("id", r.id)
      .eq("status", "open");
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    await checkBadgesOnClaim(profile.id, r.created_at);
    toast.success("Task claimed! 🎉");
    setBusy(false);
    load();
    refresh();
  };

  const complete = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("requests")
      .update({ status: "completed" })
      .eq("id", r.id);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    // Increment volunteer's tasks_helped
    const helperId = r.claimed_by ?? profile.id;
    const { data: helperProfile } = await supabase
      .from("profiles")
      .select("tasks_helped")
      .eq("id", helperId)
      .maybeSingle();
    const next = (helperProfile?.tasks_helped ?? 0) + 1;
    await supabase.from("profiles").update({ tasks_helped: next }).eq("id", helperId);
    if (helperId === profile.id) await checkBadgesOnComplete(profile.id, next);
    toast.success("Task marked completed");
    setBusy(false);
    load();
    refresh();
  };

  const back = isVolunteer ? "/volunteer" : "/dashboard";

  return (
    <AppShell hideNav>
      <div className="container-app pt-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <Link to={back} className="size-10 grid place-items-center rounded-full bg-card border">
            <ArrowLeft className="size-5" />
          </Link>
          <p className="text-primary font-bold tracking-tight">Komunity</p>
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
            {r.status}
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

        <div className="mt-4 rounded-2xl bg-warning/10 border border-warning/40 p-4 flex gap-3">
          <ShieldAlert className="size-5 shrink-0 text-warning-foreground" />
          <p className="text-xs leading-5 text-warning-foreground">
            Volunteers must not handle medication, give injections, or perform medical procedures.
            Call 995 in any emergency.
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

        <div className="mt-8">
          {isVolunteer && r.status === "open" && (
            <button
              disabled={busy}
              onClick={claim}
              className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-5" />}
              Claim This Task
            </button>
          )}

          {r.status === "claimed" && (iClaimed || isMine) && (
            <button
              disabled={busy}
              onClick={complete}
              className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-5" />}
              Mark completed
            </button>
          )}

          {r.status === "completed" && (
            <div className="rounded-2xl bg-success/15 text-success-foreground border border-success/30 p-4 text-center font-semibold">
              ✅ Task completed — thank you!
            </div>
          )}
        </div>
      </div>
    </AppShell>
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
