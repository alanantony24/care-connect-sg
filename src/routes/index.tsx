import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-soft/60 via-background to-background">
      <div className="container-app flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="size-24 rounded-3xl bg-primary text-primary-foreground grid place-items-center shadow-elevated mb-6">
          <HeartHandshake className="size-12" strokeWidth={2} />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">Komunity</h1>
        <p className="mt-3 text-muted-foreground max-w-xs">
          Caregiving, together.
        </p>
      </div>

      <div className="container-app pb-10 px-6 space-y-3">
        <Link
          to="/signup"
          className="block w-full rounded-full bg-primary text-primary-foreground text-center py-4 font-semibold shadow-elevated"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="block w-full rounded-full bg-card border text-center py-4 font-semibold"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
