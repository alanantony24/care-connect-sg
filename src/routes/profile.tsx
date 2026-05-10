import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  LogOut,
  Lock,
  Heart,
  ShieldCheck,
  Award,
  Clock,
  Star,
  ChevronRight,
  CheckCircle2,
  Camera,
  LifeBuoy,
} from "lucide-react";
import { BADGE_DEFS, type BadgeType } from "@/lib/badges";
import { SENIORS } from "@/lib/seniors";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: ProfilePage,
});

const BADGE_ICONS: Record<BadgeType, typeof Heart> = {
  first_responder: ShieldCheck,
  helping_hand: Heart,
  guardian_angel: Award,
  early_bird: Clock,
  trusted_helper: Star,
};

// Distinct colour palette per badge — uses bg + text classes for vibrant variety
const BADGE_COLORS: Record<BadgeType, string> = {
  first_responder: "bg-blue-500 text-white",
  helping_hand: "bg-rose-500 text-white",
  guardian_angel: "bg-amber-500 text-white",
  early_bird: "bg-sky-500 text-white",
  trusted_helper: "bg-violet-500 text-white",
};

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { name: string } | null;
}

function ProfilePage() {
  const { profile, refresh, signOut } = useSession();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [badges, setBadges] = useState<{ badge_type: string }[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [info, setInfo] = useState<{
    age: number | null;
    languages: string[] | null;
    experience: string | null;
    preferred_area: string | null;
    motivation: string | null;
    emergency_contact: string | null;
    notes: string | null;
    cert_status: string | null;
  } | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === "volunteer") {
      supabase
        .from("badges")
        .select("badge_type")
        .eq("user_id", profile.id)
        .then(({ data }) => setBadges(data ?? []));
      supabase
        .from("profiles")
        .select(
          "age,languages,experience,preferred_area,motivation,emergency_contact,notes,cert_status",
        )
        .eq("id", profile.id)
        .maybeSingle()
        .then(({ data }) => setInfo(data as typeof info));
    }
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(name)")
      .eq("reviewee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setReviews((data ?? []) as unknown as Review[]));
  }, [profile]);


  if (!profile) {
    return (
      <AppShell>
        <div className="container-app pt-12 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const earned = new Set((badges ?? []).map((b) => b.badge_type));
  const isVolunteer = profile.role === "volunteer";
  const avgRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const onSignOut = async () => {
    await signOut();
    nav({ to: "/" });
  };

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", profile.id);
    setUploading(false);
    if (profErr) return toast.error(profErr.message);
    toast.success("Profile picture updated");
    refresh?.();
  };

  return (
    <AppShell>
      <PageHeader title="Profile" />

      <div className="container-app">
        <div className="rounded-3xl bg-card shadow-card overflow-hidden">
          <div className="h-16 bg-primary-soft" />
          <div className="-mt-12 flex flex-col items-center text-center px-5 pb-6">
            <div className="relative">
              <div className="size-24 rounded-full bg-primary text-primary-foreground grid place-items-center text-3xl font-bold border-4 border-card shadow-elevated overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="size-full object-cover"
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={onPickAvatar}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 size-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-elevated border-2 border-card disabled:opacity-60"
                aria-label="Change profile picture"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>
            <h2 className="mt-3 text-xl font-bold flex items-center gap-1.5">
              {profile.name}
              <CheckCircle2 className="size-4 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground">
              {isVolunteer ? "Community Volunteer" : "Caregiver"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat
            icon={<CheckCircle2 className="size-5" />}
            label={isVolunteer ? "Tasks completed" : "Tasks requested"}
            value={isVolunteer ? profile.tasks_helped : profile.tasks_received}
          />
          <Stat
            icon={<Star className="size-5" />}
            label="Community Rating"
            value={avgRating ? `${avgRating}` : "—"}
            suffix={avgRating ? "stars" : undefined}
          />
        </div>

        {/* Caregiver: Care recipients */}
        {!isVolunteer && (
          <>
            <h3 className="mt-7 mb-3 text-base font-bold">Care Recipients</h3>
            <div className="space-y-2.5">
              {SENIORS.map((s) => (
                <Link
                  key={s.id}
                  to="/seniors/$id"
                  params={{ id: s.id }}
                  className="flex items-center gap-3 rounded-2xl bg-card border p-3 shadow-card active:scale-[0.99] transition-transform"
                >
                  <span className="size-12 rounded-full bg-primary-soft text-primary grid place-items-center font-semibold">
                    {s.name.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Volunteer: My Info */}
        {isVolunteer && info && (
          <>
            <h3 className="mt-7 mb-3 text-base font-bold">My Info</h3>
            <div className="rounded-2xl bg-card border shadow-card divide-y">
              {info.age != null && <InfoRow label="Age" value={`${info.age}`} />}
              {info.languages && info.languages.length > 0 && (
                <InfoRow label="Languages" value={info.languages.join(", ")} />
              )}
              {info.preferred_area && (
                <InfoRow label="Preferred area" value={info.preferred_area} />
              )}
              {info.experience && <InfoRow label="Experience" value={info.experience} />}
              {info.motivation && <InfoRow label="Motivation" value={info.motivation} />}
              {info.emergency_contact && (
                <InfoRow label="Emergency contact" value={info.emergency_contact} />
              )}
              {info.notes && <InfoRow label="Notes" value={info.notes} />}
              {info.cert_status && info.cert_status !== "none" && (
                <InfoRow
                  label="Certifications"
                  value={
                    info.cert_status === "verified"
                      ? "Verified"
                      : info.cert_status === "pending"
                        ? "Pending review (3–5 working days)"
                        : info.cert_status
                  }
                />
              )}
            </div>
          </>
        )}

        {/* Reviews */}
        <h3 className="mt-7 mb-3 text-base font-bold">Reviews</h3>
        <div className="rounded-2xl bg-card border p-4 shadow-card">
          {reviews === null ? (
            <div className="h-20 grid place-items-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No reviews yet — they appear after your first completed task.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-center">
                  <p className="text-3xl font-bold text-primary leading-none">{avgRating}</p>
                  <div className="mt-1 flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`size-3 ${
                          n <= Math.round(parseFloat(avgRating ?? "0"))
                            ? "fill-warning text-warning"
                            : "fill-transparent text-muted-foreground/40"
                        }`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  {reviews[0].comment ? (
                    <p className="italic text-muted-foreground line-clamp-4">
                      “{reviews[0].comment}”
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      {reviews.length} rating{reviews.length === 1 ? "" : "s"} from the community.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    — {reviews[0].reviewer?.name ?? "Community member"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Badges — volunteers only */}
        {isVolunteer && (
          <>
            <h3 className="mt-7 mb-3 text-base font-bold">Badges</h3>
            <div className="rounded-2xl bg-card border p-4 shadow-card">
              {badges === null ? (
                <div className="h-24 grid place-items-center">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {BADGE_DEFS.map((b) => {
                    const Icon = BADGE_ICONS[b.type];
                    const got = earned.has(b.type);
                    return (
                      <div key={b.type} className="flex flex-col items-center text-center">
                        <div
                          className={`size-16 rounded-full grid place-items-center relative shadow-elevated ${
                            got
                              ? BADGE_COLORS[b.type]
                              : "bg-muted text-muted-foreground shadow-none"
                          }`}
                        >
                          <Icon className="size-7" />
                          {!got && (
                            <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-card border grid place-items-center text-muted-foreground">
                              <Lock className="size-3" />
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-2 text-xs font-semibold leading-tight ${
                            got ? "" : "text-muted-foreground"
                          }`}
                        >
                          {b.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          className="mt-7 w-full rounded-2xl bg-card border p-4 shadow-card flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
        >
          <span className="size-11 rounded-full bg-primary-soft text-primary grid place-items-center shrink-0">
            <LifeBuoy className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Contact support</p>
            <p className="text-sm text-muted-foreground">
              Get help with tasks, payouts, or your account.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </button>

        {/* Logout */}
        <button
          onClick={onSignOut}
          className="mt-7 mb-2 w-full rounded-full bg-destructive text-destructive-foreground py-3.5 font-semibold flex items-center justify-center gap-2 shadow-elevated active:scale-[0.99] transition-transform"
        >
          <LogOut className="size-5" /> Log out
        </button>
      </div>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl bg-card border p-4 shadow-card flex items-center gap-3">
      <span className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="font-bold text-lg leading-tight">
          <span className="text-primary">{value}</span>
          {suffix && <span className="text-xs text-muted-foreground ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}
