import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Award, Heart, Star, Timer, Loader2, CheckCircle2, BadgeCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/requests/$id_/review")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: ReviewPage,
});

interface Req {
  id: string;
  title: string;
  requester_id: string;
  claimed_by: string | null;
  requester: { name: string; avatar_url: string | null } | null;
  claimer: { name: string; avatar_url: string | null } | null;
}

const BADGES = [
  { key: "gold_star", label: "Gold Star", Icon: Award },
  { key: "warm_heart", label: "Warm Heart", Icon: Heart },
  { key: "punctual", label: "Punctual", Icon: Timer },
];

function ReviewPage() {
  const { id } = Route.useParams();
  const { profile } = useSession();
  const nav = useNavigate();
  const [r, setR] = useState<Req | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [badge, setBadge] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("requests")
      .select(
        "id, title, requester_id, claimed_by, requester:profiles!requests_requester_id_fkey(name, avatar_url), claimer:profiles!requests_claimed_by_fkey(name, avatar_url)",
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setR(data as Req | null));
  }, [id]);

  if (!r || !profile) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isVolunteer = profile.role === "volunteer";
  const reviewee = isVolunteer ? r.requester : r.claimer;
  const revieweeId = isVolunteer ? r.requester_id : r.claimed_by;

  const submit = async () => {
    if (rating === 0 || !revieweeId) return toast.error("Please give a rating");
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      request_id: r.id,
      reviewer_id: profile.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
      badge: isVolunteer ? null : badge,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Review submitted. Thank you!");
    nav({ to: isVolunteer ? "/volunteer" : "/dashboard" });
  };

  const skip = () => nav({ to: isVolunteer ? "/volunteer" : "/dashboard" });

  return (
    <div className="min-h-screen bg-muted/30 pb-32">
      <header className="container-app pt-5 pb-3 flex items-center gap-3">
        <Link to="/requests/$id" params={{ id }} className="size-10 grid place-items-center rounded-full">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isVolunteer ? "Task Complete" : "Review Volunteer"}</h1>
      </header>

      <div className="container-app space-y-5">
        {!isVolunteer && (
          <div className="w-full max-w-full overflow-hidden rounded-2xl bg-card shadow-card p-4 flex items-center gap-3">
            <div className="size-12 shrink-0 rounded-full bg-primary-soft text-primary grid place-items-center font-semibold">
              {reviewee?.name.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{reviewee?.name ?? "Volunteer"}</p>
              <p className="text-xs text-muted-foreground truncate">Assisted with {r.title}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary-soft text-primary text-xs font-semibold px-2.5 py-1 flex items-center gap-1">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
          </div>
        )}

        {isVolunteer && (
          <div className="w-full max-w-full overflow-hidden rounded-2xl bg-card shadow-card p-6 text-center">
            <div className="size-16 rounded-full bg-primary-soft text-primary grid place-items-center mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="text-2xl font-bold mt-4">Yay! Task Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for your valuable support. Your help makes a real difference in the community.
            </p>
          </div>
        )}

        <div className="w-full max-w-full overflow-hidden rounded-2xl bg-card shadow-card p-5">
          <p className="text-center font-semibold">Rate your experience</p>
          <div className="mt-3 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star
                  className={`size-9 ${
                    n <= rating ? "fill-warning text-warning" : "fill-transparent text-muted-foreground/40"
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-full overflow-hidden rounded-2xl bg-card shadow-card p-5">
          <p className="text-sm font-semibold mb-2">
            {isVolunteer ? "Caregiver Review (Optional)" : "Comments (Optional)"}
          </p>
          <Textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isVolunteer
                ? "Share your experience…"
                : `Share a few words about how ${reviewee?.name?.split(" ")[0] ?? "they"} helped today…`
            }
            className="mt-2 min-h-28 w-full resize-none rounded-2xl border-border bg-background px-4 py-3 text-sm shadow-none"
          />
        </div>

        {!isVolunteer && (
          <div className="w-full max-w-full">
            <p className="font-semibold mb-3">Award a Badge (Optional)</p>
            <div className="grid w-full grid-cols-3 gap-3">
              {BADGES.map((b) => {
                const active = badge === b.key;
                const Icon = b.Icon;
                return (
                  <button
                    type="button"
                    key={b.key}
                    onClick={() => setBadge(active ? null : b.key)}
                    className={`w-full min-w-0 rounded-2xl border px-3 py-5 flex flex-col items-center gap-2 transition-colors ${
                      active ? "border-primary bg-primary-soft" : "bg-card border-border"
                    }`}
                  >
                    <span
                      className={`size-12 grid place-items-center rounded-full ${
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-6" />
                    </span>
                    <span className="max-w-full truncate text-sm font-semibold">{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t">
        <div className="container-app py-4 space-y-2">
          <button
            disabled={busy}
            onClick={submit}
            className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold shadow-elevated disabled:opacity-50"
          >
            {busy ? "Submitting…" : isVolunteer ? "Submit Review" : "Complete Review"}
          </button>
          <button onClick={skip} className="w-full text-primary text-sm font-semibold py-2">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
