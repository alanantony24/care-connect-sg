import { createFileRoute, Link, redirect, useNavigate, notFound } from "@tanstack/react-router";
import { ArrowLeft, Phone, Heart, AlertTriangle, FileText, Pencil, Accessibility } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSenior } from "@/lib/seniors";

export const Route = createFileRoute("/seniors/$id")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: SeniorDetail,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center p-6">
      <div>
        <p className="font-semibold">Care recipient not found</p>
        <Link to="/profile" className="text-primary text-sm font-semibold mt-2 inline-block">
          Back to profile
        </Link>
      </div>
    </div>
  ),
  loader: ({ params }) => {
    const senior = getSenior(params.id);
    if (!senior) throw notFound();
    return { senior };
  },
});

function SeniorDetail() {
  const { senior } = Route.useLoaderData() as { senior: import("@/lib/seniors").Senior };
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <header className="container-app pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={() => nav({ to: "/profile" })}
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
            <div className="size-24 rounded-full bg-primary text-primary-foreground grid place-items-center text-3xl font-bold border-4 border-card shadow-elevated">
              {senior.name.charAt(0)}
            </div>
            <h1 className="mt-3 text-2xl font-bold flex items-center gap-2">
              {senior.name}
              <button
                type="button"
                onClick={() => alert("Edit profile coming soon")}
                aria-label="Edit care recipient"
                className="size-8 grid place-items-center rounded-full bg-primary-soft text-primary"
              >
                <Pencil className="size-4" />
              </button>
            </h1>
            <p className="text-sm text-muted-foreground">{senior.relation}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Tile label="Sex" value={senior.sex} />
          <Tile label="Age" value={`${senior.age}`} />
          <Tile label="Blood type" value={senior.bloodType} />
        </div>

        <h3 className="mt-6 mb-3 text-base font-bold flex items-center gap-2">
          <Heart className="size-4 text-primary" /> Health information
        </h3>
        <div className="rounded-2xl bg-card border shadow-card p-4">
          <ul className="space-y-2 text-sm">
            {senior.conditions.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-6 mb-3 text-base font-bold flex items-center gap-2">
          <Accessibility className="size-4 text-primary" /> Accessibility
        </h3>
        <div className="rounded-2xl bg-card border shadow-card p-4">
          <ul className="space-y-2 text-sm">
            {senior.accessibility.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-6 mb-3 text-base font-bold flex items-center gap-2">
          <FileText className="size-4 text-primary" /> Notes for volunteers
        </h3>
        <div className="rounded-2xl bg-card border shadow-card p-4">
          <p className="text-sm leading-6 text-muted-foreground">{senior.notes}</p>
        </div>

        <div className="mt-6 rounded-2xl bg-card border shadow-card p-4 flex items-center gap-3">
          <span className="size-10 grid place-items-center rounded-xl bg-primary-soft text-primary">
            <Phone className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Emergency contact</p>
            <p className="font-semibold truncate">
              {senior.emergencyContact.name} · {senior.emergencyContact.phone}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-warning/10 border border-warning/40 p-4 flex gap-3">
          <AlertTriangle className="size-5 shrink-0 text-warning-foreground" />
          <p className="text-xs leading-5 text-warning-foreground">
            For medical emergencies dial 995. Volunteers do not handle medications or medical procedures.
          </p>
        </div>

        <Link
          to="/requests/new"
          className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated flex items-center justify-center gap-2"
        >
          Request help for {senior.name.split(" ")[0]}
        </Link>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border shadow-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold text-primary">{value}</p>
    </div>
  );
}
