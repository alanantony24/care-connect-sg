import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { HeartHandshake, Users, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();
      throw redirect({ to: profile?.role === "volunteer" ? "/volunteer" : "/dashboard" });
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-app pt-12 pb-8 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <div className="size-10 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
            <HeartHandshake className="size-5" />
          </div>
          <p className="text-primary font-bold text-xl tracking-tight">Komunity</p>
        </div>

        <h1 className="text-4xl font-bold leading-tight">
          Caregiving,<br />
          <span className="text-primary">together.</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          A peer-to-peer caregiving platform for Singapore. Caregivers post tasks. Volunteers show up.
        </p>

        <div className="mt-10 space-y-3">
          <Feature icon={<Users className="size-5" />} text="Real neighbours, real help" />
          <Feature icon={<HeartHandshake className="size-5" />} text="Earn community badges" />
          <Feature icon={<ShieldCheck className="size-5" />} text="Trusted, verified volunteers" />
        </div>

        <div className="mt-auto pt-10 space-y-3">
          <Link
            to="/signup"
            className="block w-full rounded-full bg-primary text-primary-foreground text-center py-3.5 font-semibold shadow-elevated"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="block w-full rounded-full bg-card border text-center py-3.5 font-semibold"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card border p-4 shadow-card">
      <span className="size-10 grid place-items-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="font-medium">{text}</span>
    </div>
  );
}
