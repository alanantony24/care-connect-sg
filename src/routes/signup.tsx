import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Field, Style } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up · Komunity" }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"caregiver" | "volunteer">("caregiver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name, role },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      // Email confirm required (shouldn't happen with auto-confirm)
      toast.success("Check your email to confirm your account.");
      nav({ to: "/login" });
      return;
    }
    nav({ to: role === "volunteer" ? "/volunteer" : "/dashboard" });
  };

  return (
    <div className="min-h-screen container-app pt-6 pb-10 flex flex-col">
      <Link to="/" className="size-10 grid place-items-center rounded-full bg-card border">
        <ArrowLeft className="size-5" />
      </Link>
      <h1 className="text-3xl font-bold mt-8">Join Komunity</h1>
      <p className="text-muted-foreground mt-1">Help your kampung — or get help with daily tasks.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Your name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="kinput"
            placeholder="e.g. Sarah Tan"
          />
        </Field>

        <div>
          <span className="block text-sm font-medium mb-1.5">I want to</span>
          <div className="grid grid-cols-2 gap-3">
            {(["caregiver", "volunteer"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  role === r
                    ? "border-primary bg-primary-soft"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <p className="font-semibold capitalize">{r === "caregiver" ? "Get help" : "Volunteer"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r === "caregiver" ? "Post care tasks" : "Pick up tasks nearby"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="kinput"
          />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="kinput"
            placeholder="At least 6 characters"
          />
        </Field>

        <button
          disabled={busy}
          className="w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />} Create account
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-semibold">
          Sign in
        </Link>
      </p>
      <Style />
    </div>
  );
}
