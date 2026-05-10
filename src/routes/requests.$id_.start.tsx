import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { PinDisplay, PinKeypad } from "@/components/PinPad";
import { toast } from "sonner";
import { checkBadgesOnClaim } from "@/lib/badges";

export const Route = createFileRoute("/requests/$id_/start")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: StartPin,
});

function StartPin() {
  const { id } = Route.useParams();
  const { profile, refresh } = useSession();
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (pin.length !== 4 || !profile) return;
    setBusy(true);

    const { data: req } = await supabase
      .from("requests")
      .select("start_pin, status, claimed_by, created_at")
      .eq("id", id)
      .maybeSingle();

    if (!req) {
      setBusy(false);
      toast.error("Task not found.");
      return;
    }

    if (req.status !== "claimed" || req.claimed_by !== profile.id) {
      setBusy(false);
      toast.error("You haven't been confirmed for this task yet.");
      nav({ to: "/requests/$id", params: { id } });
      return;
    }

    if (pin !== req.start_pin) {
      setBusy(false);
      setPin("");
      toast.error("Incorrect PIN. Ask the care recipient to share the start PIN.");
      return;
    }

    const startedAt = new Date().toISOString();
    const { error } = await supabase
      .from("requests")
      .update({ started_at: startedAt })
      .eq("id", id);
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    if (req.created_at) {
      await checkBadgesOnClaim(profile.id, req.created_at);
    }

    await refresh();
    toast.success("Task started!");
    setBusy(false);
    nav({ to: "/requests/$id", params: { id } });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="container-app pt-5 pb-3 flex items-center justify-between border-b">
        <Link
          to="/requests/$id"
          params={{ id }}
          className="size-10 grid place-items-center rounded-full"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-primary font-bold text-lg">CareKampung</p>
        <div className="size-10" />
      </header>

      <div className="container-app pt-8">
        <div className="rounded-3xl bg-card shadow-card p-6 pb-8">
          <div className="grid place-items-center">
            <div className="size-14 rounded-full bg-primary-soft text-primary grid place-items-center mb-3">
              <ShieldCheck className="size-7" />
            </div>
            <h1 className="text-3xl font-bold text-center">Enter Start PIN</h1>
            <p className="mt-2 text-center text-muted-foreground text-sm max-w-xs">
              Ask the care recipient for their unique start PIN to verify the visit.
            </p>
          </div>

          <div className="mt-6">
            <PinDisplay value={pin} />
          </div>

          <div className="mt-6">
            <PinKeypad value={pin} onChange={setPin} />
          </div>

          <button
            onClick={verify}
            disabled={pin.length !== 4 || busy}
            className="mt-7 w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Verify & Start Task
            {!busy && <ArrowRight className="size-4" />}
          </button>

          <button className="mt-4 w-full text-primary text-sm font-semibold">
            Having trouble?
          </button>
        </div>
      </div>
    </div>
  );
}
