import { createFileRoute, Link, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck, Clock, MapPin, Languages, FileCheck2, AlertCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profiles/$id")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: PublicProfile,
});

interface PublicProfileRow {
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
  cert_status: string;
  cert_url: string | null;
}

function PublicProfile() {
  const { id } = useParams({ from: "/profiles/$id" });
  const nav = useNavigate();
  const [p, setP] = useState<PublicProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select(
        "id, name, role, avatar_url, tasks_helped, age, languages, experience, preferred_area, motivation, cert_status, cert_url",
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setP((data as PublicProfileRow | null) ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!p) {
    return (
      <div className="min-h-screen grid place-items-center text-center p-6">
        <p className="font-semibold">Profile not found</p>
      </div>
    );
  }

  const certVerified = p.cert_status === "verified";
  const certPending = p.cert_status === "pending";

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
        <div className="size-10" />
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
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-semibold">
                <Clock className="size-3.5" /> {p.tasks_helped} tasks completed
              </span>
              {certVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 text-success px-3 py-1 text-xs font-semibold">
                  <ShieldCheck className="size-3.5" /> Verified
                </span>
              )}
              {certPending && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 text-warning-foreground px-3 py-1 text-xs font-semibold">
                  <FileCheck2 className="size-3.5" /> Cert pending review
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-card border shadow-card p-4 space-y-3 text-sm">
          {p.age != null && (
            <Row icon={<AlertCircle className="size-4" />} label="Age" text={`${p.age} years`} />
          )}
          {p.languages?.length ? (
            <Row icon={<Languages className="size-4" />} label="Languages" text={p.languages.join(", ")} />
          ) : null}
          {p.preferred_area && (
            <Row icon={<MapPin className="size-4" />} label="Preferred area" text={p.preferred_area} />
          )}
        </div>

        {p.experience && (
          <>
            <h3 className="mt-6 mb-2 text-sm font-bold">Experience</h3>
            <div className="rounded-2xl bg-card border shadow-card p-4 text-sm leading-6 text-muted-foreground">
              {p.experience}
            </div>
          </>
        )}

        {p.motivation && (
          <>
            <h3 className="mt-6 mb-2 text-sm font-bold">Why they volunteer</h3>
            <div className="rounded-2xl bg-card border shadow-card p-4 text-sm leading-6 text-muted-foreground">
              {p.motivation}
            </div>
          </>
        )}

        <Link
          to="/messages/$peerId"
          params={{ peerId: p.id }}
          className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated flex items-center justify-center gap-2"
        >
          <MessageCircle className="size-5" /> Message {p.name.split(" ")[0]}
        </Link>
      </div>
    </div>
  );
}

function Row({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="size-8 grid place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold truncate">{text}</p>
      </div>
    </div>
  );
}
