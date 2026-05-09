import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Lock, Heart, ShieldCheck, Award, Clock, Star } from "lucide-react";
import { BADGE_DEFS, type BadgeType } from "@/lib/badges";
import { taskMeta } from "@/lib/tasks";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
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

function ProfilePage() {
  const { profile, signOut } = useSession();
  const nav = useNavigate();
  const [badges, setBadges] = useState<{ badge_type: string }[] | null>(null);
  const [recent, setRecent] = useState<
    { id: string; title: string; status: string; task_type: string; created_at: string }[] | null
  >(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("badges")
      .select("badge_type")
      .eq("user_id", profile.id)
      .then(({ data }) => setBadges(data ?? []));

    const col = profile.role === "volunteer" ? "claimed_by" : "requester_id";
    supabase
      .from("requests")
      .select("id, title, status, task_type, created_at")
      .eq(col, profile.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent(data ?? []));
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

  const onSignOut = async () => {
    await signOut();
    nav({ to: "/" });
  };

  return (
    <AppShell>
      <PageHeader
        title="Profile"
        right={
          <button
            onClick={onSignOut}
            className="size-10 grid place-items-center rounded-full bg-card border text-muted-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        }
      />

      <div className="container-app">
        <div className="flex flex-col items-center text-center">
          <div className="size-24 rounded-full bg-primary-soft text-primary grid place-items-center text-3xl font-bold border-4 border-card shadow-elevated">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-3 text-xl font-bold">{profile.name}</h2>
          <p className="text-sm text-muted-foreground capitalize">
            {profile.role === "volunteer" ? "Community Volunteer" : "Caregiver"}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Tasks helped" value={profile.tasks_helped} />
          <Stat label="Tasks received" value={profile.tasks_received} />
        </div>

        <h3 className="mt-7 mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Badges
        </h3>
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
                      className={`size-16 rounded-full grid place-items-center relative ${
                        got
                          ? "bg-primary text-primary-foreground shadow-elevated"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-7" />
                      {!got && (
                        <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-card border grid place-items-center text-muted-foreground">
                          <Lock className="size-3" />
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 text-xs font-semibold ${got ? "" : "text-muted-foreground"}`}>
                      {b.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <h3 className="mt-7 mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Recent activity
        </h3>
        <div className="space-y-2">
          {recent === null ? (
            <div className="h-20 rounded-2xl bg-card border animate-pulse" />
          ) : recent.length === 0 ? (
            <p className="rounded-2xl bg-card border p-4 text-sm text-muted-foreground text-center">
              No activity yet.
            </p>
          ) : (
            recent.map((t) => {
              const Icon = taskMeta(t.task_type).icon;
              return (
                <Link
                  key={t.id}
                  to="/requests/$id"
                  params={{ id: t.id }}
                  className="flex items-center gap-3 rounded-2xl bg-card border p-3 shadow-card"
                >
                  <span className="size-10 grid place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t.status}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card border p-4 shadow-card text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
