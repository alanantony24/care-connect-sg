import { createFileRoute, Link, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Star, BadgeCheck, MapPin, Languages, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profiles/$id")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: PublicProfile,
});

interface ProfileRow {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  tasks_helped: number;
  age: number | null;
  languages: string[] | null;
  experience: string | null;
  preferred_area: string | null;
  motivation: string | null;
  cert_status: string | null;
}

function PublicProfile() {
  const { id } = useParams({ from: "/profiles/$id" });
  const nav = useNavigate();
  const [p, setP] = useState<ProfileRow | null>(null);
  const [avg, setAvg] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select(
        "id,name,role,avatar_url,tasks_helped,age,languages,experience,preferred_area,motivation,cert_status",
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setP(data as ProfileRow | null));
    supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", id)
      .then(({ data }) => {
        if (!data || data.length === 0) return setAvg(null);
        setAvg(data.reduce((s, r) => s + r.rating, 0) / data.length);
      });
  }, [id]);

  if (!p) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <header className="container-app pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={() => nav({ to: ".." as any })}
          className="size-10 grid place-items-center rounded-full bg-card border"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-primary font-bold tracking-tight">Komunity</p>
        <Link
          to="/messages/$peerId"
          params={{ peerId: p.id }}
          className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground"
          aria-label="Message"
        >
          <MessageCircle className="size-5" />
        </Link>
      </header>

      <div className="container-app">
        <div className="rounded-3xl bg-card shadow-card overflow-hidden">
          <div className="h-16 bg-primary-soft" />
          <div className="-mt-12 flex flex-col items-center text-center px-5 pb-6">
            <div className="size-24 rounded-full bg-primary text-primary-foreground grid place-items-center text-3xl font-bold border-4 border-card shadow-elevated overflow-hidden">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.name} className="size-full object-cover" />
              ) : (
                p.name.charAt(0).toUpperCase()
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold">{p.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{p.role}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Star className="size-3.5 fill-warning text-warning" />
                {avg ? avg.toFixed(1) : "—"}
              </span>
              <span className="text-muted-foreground">{p.tasks_helped} tasks helped</span>
              {p.cert_status === "pending" && (
                <span className="rounded-full bg-warning/20 text-warning-foreground px-2 py-0.5 font-semibold">
                  Cert pending
                </span>
              )}
              {p.cert_status === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success px-2 py-0.5 font-semibold">
                  <BadgeCheck className="size-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {p.age && (
            <Row label="Age" value={`${p.age}`} />
          )}
          {p.languages && p.languages.length > 0 && (
            <Row
              icon={<Languages className="size-4" />}
              label="Languages"
              value={p.languages.join(", ")}
            />
          )}
          {p.preferred_area && (
            <Row
              icon={<MapPin className="size-4" />}
              label="Preferred area"
              value={p.preferred_area}
            />
          )}
          {p.experience && (
            <Block label="Experience" text={p.experience} />
          )}
          {p.motivation && (
            <Block label="Why they volunteer" text={p.motivation} />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card border p-3 shadow-card">
      {icon && (
        <span className="size-9 grid place-items-center rounded-full bg-primary-soft text-primary">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-card border p-4 shadow-card">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
        {label}
      </p>
      <p className="text-sm leading-6">{text}</p>
    </div>
  );
}
