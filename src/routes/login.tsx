import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Komunity" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    nav({ to: prof?.role === "volunteer" ? "/volunteer" : "/dashboard" });
  };

  return (
    <div className="min-h-screen container-app pt-6 pb-10 flex flex-col">
      <Link to="/" className="size-10 grid place-items-center rounded-full bg-card border">
        <ArrowLeft className="size-5" />
      </Link>
      <h1 className="text-3xl font-bold mt-8">Welcome back</h1>
      <p className="text-muted-foreground mt-1">Sign in to continue helping your community.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="kinput"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="kinput"
            placeholder="••••••••"
          />
        </Field>
        <button
          disabled={busy}
          className="w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />} Sign in
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        New to Komunity?{" "}
        <Link to="/signup" className="text-primary font-semibold">
          Create an account
        </Link>
      </p>
      <Style />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function Style() {
  return (
    <style>{`.kinput{width:100%;border-radius:0.875rem;border:1px solid var(--border);background:var(--card);padding:0.95rem 1rem;font-size:0.95rem;color:var(--foreground);outline:none}.kinput:focus{border-color:var(--ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--ring) 18%,transparent)}`}</style>
  );
}
