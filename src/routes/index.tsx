import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { Heart, ShieldCheck, Users, Sparkles } from "lucide-react";
import { useSession } from "@/lib/session";
import type { Role } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareKampung — Trusted community caregiving for Singapore" },
      {
        name: "description",
        content:
          "CareKampung helps Singapore caregivers coordinate trusted volunteers for senior walks, appointments, and daily wellbeing.",
      },
      { property: "og:title", content: "CareKampung — Caregiving, together." },
      {
        property: "og:description",
        content:
          "A civic-tech platform connecting caregivers with verified volunteers for low-risk eldercare support.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { role, setSession } = useSession();
  const navigate = useNavigate();

  if (role) return <Navigate to={role === "volunteer" ? "/volunteer" : role === "admin" ? "/admin" : "/dashboard"} />;

  const demoLogin = (r: Role, name: string) => {
    setSession(r, name);
    navigate({ to: r === "volunteer" ? "/volunteer" : r === "admin" ? "/admin" : "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-app py-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="size-10 rounded-2xl gradient-primary grid place-items-center text-primary-foreground shadow-elevated">
            <Heart className="size-5" fill="currentColor" />
          </div>
          <p className="font-semibold">CareKampung</p>
        </div>

        <div className="rounded-3xl gradient-warm p-6 mb-6 border">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1 text-xs font-medium text-foreground border">
            <Sparkles className="size-3" /> Civic-tech MVP · Singapore
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight leading-tight">
            Caregiving,<br />together.
          </h1>
          <p className="mt-3 text-[15px] text-foreground/80 leading-relaxed">
            Coordinate trusted volunteers to walk with mum, escort dad to dialysis, or simply keep your loved ones company.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <Feature icon={<Users className="size-4" />} title="Trusted neighbours" hint="Verified volunteers in your kampung." />
          <Feature icon={<ShieldCheck className="size-4" />} title="Safe by design" hint="Low-risk tasks only. No medical procedures." />
          <Feature icon={<Heart className="size-4" />} title="Less burnout" hint="Share the load with a community of helpers." />
        </div>

        <p className="text-xs text-muted-foreground mb-3 font-medium">Try the demo as:</p>
        <div className="grid gap-2.5">
          <DemoButton onClick={() => demoLogin("caregiver", "Wei Ming")} title="Caregiver" subtitle="Manage senior care & request help" emoji="👨‍👧" />
          <DemoButton onClick={() => demoLogin("volunteer", "Aisha")} title="Volunteer" subtitle="Browse & accept nearby tasks" emoji="🧕" />
          <DemoButton onClick={() => demoLogin("admin", "Coordinator")} title="Admin" subtitle="Coordinate & verify volunteers" emoji="🛡️" />
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-muted-foreground text-center">
          CareKampung is not a replacement for professional medical care.<br />
          Volunteers do not administer medication or perform medical procedures.
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card border p-3.5 shadow-card">
      <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function DemoButton({
  onClick, title, subtitle, emoji,
}: { onClick: () => void; title: string; subtitle: string; emoji: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border bg-card p-4 shadow-card hover:shadow-elevated hover:border-primary/40 transition-all flex items-center gap-3 active:scale-[0.99]"
    >
      <div className="size-11 rounded-xl bg-secondary grid place-items-center text-2xl">{emoji}</div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="text-primary text-xl">→</span>
    </button>
  );
}
