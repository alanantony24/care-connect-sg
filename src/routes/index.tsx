import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";
import { useSession } from "@/lib/session";
import type { Role } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareKampung: trusted community care" },
      {
        name: "description",
        content:
          "CareKampung helps caregivers coordinate safe, practical volunteer support for seniors.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { role, setSession } = useSession();
  const navigate = useNavigate();

  if (role)
    return (
      <Navigate
        to={role === "volunteer" ? "/volunteer" : role === "admin" ? "/admin" : "/dashboard"}
      />
    );

  const demoLogin = (r: Role, name: string) => {
    setSession(r, name);
    navigate({ to: r === "volunteer" ? "/volunteer" : r === "admin" ? "/admin" : "/dashboard" });
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container-app grid min-h-screen content-center gap-8 py-8 md:grid-cols-[1fr_25rem] md:items-center">
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <HeartHandshake className="size-5" />
            </div>
            <p className="font-semibold">CareKampung</p>
          </div>

          <p className="mb-3 text-sm font-semibold text-primary">For caregivers in Singapore</p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Get safe help for one care task at a time.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            Request trusted volunteers for walks, appointment escorts, and simple reminders. Keep
            medical details limited to what helpers need to know.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Principle
              icon={<UsersRound className="size-4" />}
              title="Human first"
              text="Care tasks are plain, specific, and easy to accept."
            />
            <Principle
              icon={<ShieldCheck className="size-4" />}
              title="Boundaries clear"
              text="Volunteers do not administer medication or treatment."
            />
            <Principle
              icon={<HeartHandshake className="size-4" />}
              title="Low effort"
              text="Caregivers see only what needs attention today."
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-elevated">
          <p className="mb-3 text-sm font-semibold">Open demo</p>
          <div className="grid gap-2">
            <DemoButton
              onClick={() => demoLogin("caregiver", "Wei Ming")}
              title="Caregiver"
              subtitle="Check today and request help"
            />
            <DemoButton
              onClick={() => demoLogin("volunteer", "Aisha")}
              title="Volunteer"
              subtitle="View safe tasks nearby"
            />
            <DemoButton
              onClick={() => demoLogin("admin", "Coordinator")}
              title="Coordinator"
              subtitle="Monitor requests and volunteers"
            />
          </div>
          <p className="mt-4 border-t pt-4 text-xs leading-5 text-muted-foreground">
            Prototype only. Call 995 for emergencies. Volunteers handle low-risk support tasks only.
          </p>
        </section>
      </div>
    </main>
  );
}

function Principle({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 size-8 rounded-md bg-primary/10 text-primary grid place-items-center">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function DemoButton({
  onClick,
  title,
  subtitle,
}: {
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-md border bg-background p-4 text-left transition-colors hover:border-primary"
    >
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
    </button>
  );
}
