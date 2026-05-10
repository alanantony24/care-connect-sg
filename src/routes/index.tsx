import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { HeartHandshake, Sparkles, UsersRound } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,oklch(0.9_0.07_155_/_0.7),transparent_36%),linear-gradient(to_bottom,var(--background),var(--background))]">
      <div className="container-app flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="relative mb-6 size-28">
          <div className="absolute inset-0 rounded-[2rem] bg-primary/25 blur-2xl" />
          <div className="relative size-28 rounded-[2rem] border border-white/45 bg-white/35 text-primary shadow-elevated backdrop-blur-xl grid place-items-center overflow-hidden dark:bg-white/10 dark:border-white/15">
            <div className="absolute -right-6 -top-6 size-20 rounded-full bg-primary/25 blur-xl" />
            <div className="absolute inset-x-4 top-0 h-px bg-white/80 dark:bg-white/25" />
            <HeartHandshake className="relative size-13" strokeWidth={2.3} />
            <span className="absolute left-4 bottom-4 size-9 rounded-full bg-card/70 text-primary grid place-items-center shadow-card backdrop-blur">
              <UsersRound className="size-4.5" strokeWidth={2.3} />
            </span>
            <span className="absolute right-4 top-4 size-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-card">
              <Sparkles className="size-4" strokeWidth={2.4} />
            </span>
          </div>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">Komunity</h1>
        <p className="mt-3 text-muted-foreground max-w-xs">Caregiving, together.</p>
      </div>

      <div className="container-app pb-10 px-6 space-y-3">
        <Link
          to="/signup"
          className="relative block w-full overflow-hidden rounded-full border border-white/35 bg-primary/85 text-primary-foreground text-center py-4 font-semibold shadow-elevated backdrop-blur-xl active:scale-[0.99] transition-transform"
        >
          <span className="absolute inset-x-8 top-0 h-px bg-white/65" />
          <span className="relative">Get started</span>
        </Link>
        <Link
          to="/login"
          className="relative block w-full overflow-hidden rounded-full border border-white/45 bg-card/55 text-foreground text-center py-4 font-semibold shadow-card backdrop-blur-xl active:scale-[0.99] transition-transform dark:border-white/15 dark:bg-white/10"
        >
          <span className="absolute inset-x-8 top-0 h-px bg-white/70 dark:bg-white/25" />
          <span className="relative">Login</span>
        </Link>
      </div>
    </div>
  );
}
