import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Star, CheckCircle2, ShieldCheck, FileText, Heart, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/profiles/$id")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: PublicProfile,
});

interface FullProfile {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  tasks_helped: number;
  tasks_received: number;
  age: number | null;
  languages: string[] | null;
  experience: string | null;
  preferred_area: string | null;
  motivation: string | null;
  emergency_contact: string | null;
  notes: string | null;
  cert_status: string;
}

function PublicProfile() {
  const { id } = useParams({ from: "/profiles/$id" });
  const { profile: me } = useSession();
  const [p, setP] = useState<FullProfile | null>(null);
  const [avg, setAvg] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setP(data as FullProfile | null));
    supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", id)
      .then(({ data }) => {
        if (!data || data.length === 0) return setAvg(null);
        setAvg(data.reduce((s, r: any) => s + r.rating, 0) / data.length);
      });
  }, [id]);

  if (!p) {
    return (
      <AppShell hideNav>
        <div className="container-app pt-16 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const isVolunteer = p.role === "volunteer";

  return (
    <AppShell hideNav>
      <div className="container-app pt-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => history.back()}
            className="size-10 grid place-items-center rounded-full bg-card border"
          >
            <ArrowLeft className="size-5" />
          </button>
          <p className="text-primary font-bold tracking-tight">Komunity</p>
          <div className="size-10" />
        </div>

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
            <h2 className="mt-3 text-xl font-bold flex items-center gap-1.5">
              {p.name}
              {p.cert_status === "verified" && <CheckCircle2 className="size-4 text-primary" />}
            </h2>
            <p className="text-sm text-muted-foreground capitalize">{p.role}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat
            icon={<CheckCircle2 className="size-5" />}
            label={isVolunteer ? "Tasks completed" : "Tasks requested"}
            value={isVolunteer ? p.tasks_helped : p.tasks_received}
          />
          <Stat
            icon={<Star className="size-5" />}
            label="Rating"
            value={avg ? avg.toFixed(1) : "—"}
            suffix={avg ? "stars" : undefined}
          />
        </div>

        {isVolunteer && (
          <div className="mt-4 rounded-2xl bg-card border shadow-card divide-y">
            {p.age && <Row label="Age" text={`${p.age}`} />}
            {p.languages && p.languages.length > 0 && (
              <Row label="Languages" text={p.languages.join(", ")} />
            )}
            {p.preferred_area && (
              <Row icon={<MapPin className="size-5" />} label="Preferred area" text={p.preferred_area} />
            )}
            {p.cert_status !== "none" && (
              <Row
                icon={<ShieldCheck className="size-5" />}
                label="Certifications"
                text={p.cert_status === "verified" ? "Verified" : "Pending review (3–5 working days)"}
              />
            )}
            {p.experience && (
              <DetailBlock icon={<FileText className="size-5" />} label="Experience" text={p.experience} />
            )}
            {p.motivation && (
              <DetailBlock icon={<Heart className="size-5" />} label="Motivation" text={p.motivation} />
            )}
            {p.emergency_contact && (
              <Row icon={<Phone className="size-5" />} label="Emergency contact" text={p.emergency_contact} />
            )}
            {p.notes && <DetailBlock label="Notes" text={p.notes} />}
          </div>
        )}

        {me && me.id !== p.id && (
          <Link
            to="/messages/$peerId"
            params={{ peerId: p.id }}
            className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated flex items-center justify-center gap-2"
          >
            <MessageCircle className="size-5" /> Message {p.name.split(" ")[0]}
          </Link>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string | number; suffix?: string }) {
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

function Row({ icon, label, text }: { icon?: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-center gap-4 p-4">
      {icon && (
        <span className="size-10 grid place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold break-words">{text}</p>
      </div>
    </div>
  );
}

function DetailBlock({ icon, label, text }: { icon?: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-start gap-4 p-4">
      {icon && (
        <span className="size-10 grid place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm leading-6 mt-1 whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
