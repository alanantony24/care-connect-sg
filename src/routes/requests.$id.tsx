import { createFileRoute, Link, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FeeReceipt } from "@/components/FeeReceipt";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { platformFeeFor, PRIORITY_META, taskBadgeStyle, taskMeta, volunteerPayoutFor, type Priority } from "@/lib/tasks";
import { toast } from "sonner";
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
  Wallet,
  MessageCircle,
  HandHeart,
  UserCheck,
  Hourglass,
  Eye,
} from "lucide-react";
import { formatDateFriendly, formatTimeFriendly } from "@/lib/format";

export const Route = createFileRoute("/requests/$id")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
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
  started_at: string | null;
  payment_amount: number | null;
  priority: string | null;
  requester: { name: string; avatar_url: string | null } | null;
  claimer: { name: string; avatar_url: string | null } | null;
}

interface Application {
  id: string;
  volunteer_id: string;
  status: string;
  created_at: string;
  volunteer: { name: string; avatar_url: string | null; tasks_helped: number } | null;
}

function TaskDetail() {
  const { id } = useParams({ from: "/requests/$id" });
  const { profile } = useSession();
  const nav = useNavigate();
  const [r, setR] = useState<RequestRow | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [myApp, setMyApp] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("requests")
      .select(
        "*, requester:profiles!requests_requester_id_fkey(name, avatar_url), claimer:profiles!requests_claimed_by_fkey(name, avatar_url)",
      )
      .eq("id", id)
      .maybeSingle();
    setR(data as RequestRow | null);
  }, [id]);

  const loadApps = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("applications")
      .select(
        "id, volunteer_id, status, created_at, volunteer:profiles!applications_volunteer_id_fkey(name, avatar_url, tasks_helped)",
      )
      .eq("request_id", id)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as unknown as Application[];
    setApps(list);
    setMyApp(list.find((a) => a.volunteer_id === profile.id) ?? null);
  }, [id, profile]);

  useEffect(() => {
    load();
    loadApps();
  }, [load, loadApps]);

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
  const taskStyle = taskBadgeStyle(r.task_type);
  const Icon = meta.icon;
  const isVolunteer = profile.role === "volunteer";
  const isMine = profile.id === r.requester_id;
  const iClaimed = profile.id === r.claimed_by;
  const isStarted = r.status === "claimed" && Boolean(r.started_at);
  const ageHours = (Date.now() - new Date(r.created_at).getTime()) / 36e5;
  void ageHours;
  const pendingApps = apps.filter((a) => a.status === "pending");
  const grossAmount = Number(r.payment_amount ?? 0);
  const platformFee = platformFeeFor(grossAmount);
  const volunteerPayout = volunteerPayoutFor(grossAmount);

  const apply = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("applications")
      .insert({ request_id: id, volunteer_id: profile.id, status: "pending" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Application sent. Estimated payout after fee: S$${volunteerPayout.toFixed(2)}.`);
    loadApps();
  };

  const withdraw = async () => {
    if (!myApp) return;
    setBusy(true);
    const { error } = await supabase.from("applications").delete().eq("id", myApp.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Application withdrawn");
    loadApps();
  };

  const confirmVolunteer = async (volunteerId: string) => {
    setBusy(true);
    const { error: e1 } = await supabase
      .from("requests")
      .update({ status: "claimed", claimed_by: volunteerId })
      .eq("id", id);
    if (e1) {
      setBusy(false);
      return toast.error(e1.message);
    }
    await supabase
      .from("applications")
      .update({ status: "accepted" })
      .eq("request_id", id)
      .eq("volunteer_id", volunteerId);
    await supabase
      .from("applications")
      .update({ status: "declined" })
      .eq("request_id", id)
      .neq("volunteer_id", volunteerId)
      .eq("status", "pending");
    setBusy(false);
    toast.success("Volunteer confirmed");
    load();
    loadApps();
  };

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
          {(() => {
            const p = (r.priority ?? "normal") as Priority;
            const meta = PRIORITY_META[p] ?? PRIORITY_META.normal;
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-semibold px-3 py-1.5 ${meta.chip}`}
              >
                <span className={`size-2 rounded-full ${meta.dot}`} />
                {meta.label} priority
              </span>
            );
          })()}
          <span
            className={`rounded-full border text-xs font-semibold px-3 py-1.5 capitalize backdrop-blur-md ${taskStyle.compact}`}
          >
            {meta.label}
          </span>
          <span className="rounded-full bg-muted text-muted-foreground text-xs font-semibold px-3 py-1.5 capitalize">
            {isStarted ? "in progress" : r.status.replace("_", " ")}
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-white/15 bg-card p-5 shadow-card overflow-hidden relative">
          <div
            className={`absolute inset-x-0 top-0 h-32 ${taskStyle.glass} opacity-95 pointer-events-none`}
          />
          <div
            className={`absolute -right-10 -top-10 size-36 rounded-full ${taskStyle.glow} blur-3xl`}
          />
          <div className="relative">
            <span
              className={`size-20 grid place-items-center rounded-2xl ${taskStyle.icon} shadow-elevated backdrop-blur-md`}
            >
              <Icon className="size-10" strokeWidth={2.3} />
            </span>

            <div className="mt-7">
              <h1 className="text-3xl font-bold leading-tight">{r.title}</h1>
              <p className="mt-2 text-base leading-7 text-muted-foreground">
                {r.notes ?? "No additional notes provided."}
              </p>
            </div>

            <div className="mt-6 border-t pt-5 space-y-4">
              <TaskCardDetail
                icon={<Icon className="size-5" />}
                label="Task type"
                text={meta.label}
              />
              <TaskCardDetail
                icon={<Calendar className="size-5" />}
                label="Date & Time"
                text={`${formatDateFriendly(r.date_needed)}, ${formatTimeFriendly(r.time_needed)}`}
              />
              <TaskCardDetail
                icon={<MapPin className="size-5" />}
                label="Location"
                text={r.location}
              />
              <TaskCardDetail
                icon={<Clock className="size-5" />}
                label="Posted"
                text={`${Math.max(1, Math.round(ageHours))}h ago`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-card border p-4 shadow-card">
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

        <div className="mt-4 rounded-2xl overflow-hidden border shadow-card bg-muted">
          <iframe
            title="Task location map"
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${r.location}, Singapore`)}&output=embed`}
            className="w-full h-48 border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-soft to-card p-4 flex items-center gap-3">
          <span className="size-11 grid place-items-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {isStarted
                ? "Payment on hold"
                : r.status === "completed"
                  ? "Payment released"
                  : "Payment offered"}
            </p>
            <p className="text-2xl font-bold text-primary">S${grossAmount.toFixed(2)}</p>
          </div>
          <span className="text-[11px] text-muted-foreground max-w-[40%] text-right leading-tight">
            {isStarted
              ? "Released after end PIN"
              : r.status === "completed"
                ? "Sent to volunteer"
                : "Held securely until task ends"}
          </span>
        </div>

        {/* PINs visible to caregiver (the requester) only — only after a volunteer is confirmed.
            Start PIN appears once confirmed; End PIN appears once the volunteer starts the task. */}
        {isMine && r.status === "claimed" && (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary-soft/40 p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <p className="text-xs uppercase tracking-wider font-semibold text-primary">
                Your task PINs
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isStarted
                ? "Share the End PIN once the visit is finished."
                : "Share the Start PIN with the volunteer when they arrive."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <PinBlock label="Start PIN" value={r.start_pin} />
              {isStarted ? (
                <PinBlock label="End PIN" value={r.end_pin} />
              ) : (
                <div className="rounded-xl bg-card/60 border border-dashed p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    End PIN
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Available after task starts</p>
                </div>
              )}
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
              <p className="font-semibold flex-1">{r.claimer.name}</p>
              {profile.id !== r.claimed_by && r.claimed_by && (
                <Link
                  to="/messages/$peerId"
                  params={{ peerId: r.claimed_by }}
                  className="size-10 grid place-items-center rounded-full bg-primary-soft text-primary"
                  aria-label="Message volunteer"
                >
                  <MessageCircle className="size-5" />
                </Link>
              )}
            </div>
          </div>
        )}

        {isVolunteer && (myApp || iClaimed) && r.requester_id !== profile.id && (
          <Link
            to="/messages/$peerId"
            params={{ peerId: r.requester_id }}
            className="mt-4 flex items-center gap-3 rounded-2xl bg-card border p-4 shadow-card"
          >
            <span className="size-10 grid place-items-center rounded-full bg-primary-soft text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">Message caregiver</p>
              <p className="text-xs text-muted-foreground">
                Coordinate details with {r.requester?.name ?? "the caregiver"}.
              </p>
            </div>
          </Link>
        )}

        {/* Caregiver: applicants list while task is open */}
        {isMine && r.status === "open" && (
          <div className="mt-5">
            <h3 className="mb-3 text-base font-bold flex items-center gap-2">
              <HandHeart className="size-4 text-primary" />
              Volunteer applications
              <span className="ml-auto text-xs font-medium text-muted-foreground">
                {pendingApps.length} {pendingApps.length === 1 ? "applicant" : "applicants"}
              </span>
            </h3>
            {pendingApps.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-center">
                <p className="font-semibold">Waiting for volunteers</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll see applicants here as they apply.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {pendingApps.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-2xl bg-card border p-3 shadow-card flex items-center gap-3"
                  >
                    <div className="size-12 rounded-full bg-primary-soft text-primary grid place-items-center font-semibold">
                      {a.volunteer?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{a.volunteer?.name ?? "Volunteer"}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.volunteer?.tasks_helped ?? 0} tasks completed
                      </p>
                    </div>
                    <Link
                      to="/profiles/$id"
                      params={{ id: a.volunteer_id }}
                      className="rounded-full border bg-card text-xs font-semibold px-3 py-2 flex items-center gap-1"
                      aria-label="View volunteer profile"
                    >
                      <Eye className="size-3.5" /> View
                    </Link>
                    <Link
                      to="/messages/$peerId"
                      params={{ peerId: a.volunteer_id }}
                      className="size-9 grid place-items-center rounded-full bg-muted text-muted-foreground"
                      aria-label="Message volunteer"
                    >
                      <MessageCircle className="size-4" />
                    </Link>
                    <button
                      disabled={busy}
                      onClick={() => confirmVolunteer(a.volunteer_id)}
                      className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 shadow-elevated disabled:opacity-50 flex items-center gap-1"
                    >
                      <UserCheck className="size-3.5" /> Confirm
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-8 space-y-2">
          {/* Volunteer: open task — apply or pending */}
          {isVolunteer && r.status === "open" && !myApp && (
            <>
              <div className="rounded-2xl border border-primary/20 bg-primary-soft/45 p-4">
                <p className="text-sm font-semibold text-primary">Before you apply</p>
                <FeeReceipt
                  amount={grossAmount}
                  fee={platformFee}
                  payout={volunteerPayout}
                  amountLabel="Task pays"
                  className="mt-3 border-primary/15 bg-card/70"
                />
              </div>
              <button
                disabled={busy}
                onClick={apply}
                className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <HandHeart className="size-5" /> Apply for this task
              </button>
            </>
          )}

          {isVolunteer && r.status === "open" && myApp && (
            <>
              <div className="rounded-2xl bg-warning/15 border border-warning/40 p-4 flex items-center gap-3">
                <Hourglass className="size-5 text-warning-foreground" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">Application pending</p>
                  <p className="text-xs text-muted-foreground">
                    The caregiver will confirm a volunteer soon.
                  </p>
                </div>
              </div>
              <button
                disabled={busy}
                onClick={withdraw}
                className="w-full rounded-full bg-card border py-3.5 font-semibold disabled:opacity-50"
              >
                Withdraw application
              </button>
            </>
          )}

          {/* Volunteer not selected after caregiver confirmed */}
          {isVolunteer && r.status === "claimed" && !iClaimed && myApp && (
            <div className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">
              Another volunteer was selected for this task. Thanks for offering to help!
            </div>
          )}

          {/* Volunteer confirmed: start task */}
          {isVolunteer && r.status === "claimed" && iClaimed && !isStarted && (
            <button
              onClick={() => nav({ to: "/requests/$id/start", params: { id } })}
              className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated flex items-center justify-center gap-2"
            >
              <PlayCircle className="size-5" /> Start Task with PIN
            </button>
          )}

          {isStarted && iClaimed && (
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

function TaskCardDetail({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold leading-snug break-words">{text}</p>
      </div>
    </div>
  );
}
