import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Loader2, CheckCircle2, Wallet, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { PinDisplay, PinKeypad } from "@/components/PinPad";
import { toast } from "sonner";
import { checkBadgesOnComplete } from "@/lib/badges";

export const Route = createFileRoute("/requests/$id_/end")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: EndPin,
});

function EndPin() {
  const { id } = Route.useParams();
  const { profile, refresh } = useSession();
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [payout, setPayout] = useState(0);
  const [requesterName, setRequesterName] = useState("the caregiver");

  const verify = async () => {
    if (pin.length !== 4 || !profile) return;
    setBusy(true);

    const { data: req } = await supabase
      .from("requests")
      .select("end_pin, claimed_by, payment_amount, requester:profiles!requests_requester_id_fkey(name)")
      .eq("id", id)
      .maybeSingle();

    if (!req || pin !== req.end_pin) {
      setBusy(false);
      setPin("");
      toast.error("Incorrect PIN.");
      return;
    }

    await supabase
      .from("requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);

    const helperId = req.claimed_by ?? profile.id;
    const { data: helperProfile } = await supabase
      .from("profiles")
      .select("tasks_helped")
      .eq("id", helperId)
      .maybeSingle();
    const next = (helperProfile?.tasks_helped ?? 0) + 1;
    await supabase.from("profiles").update({ tasks_helped: next }).eq("id", helperId);
    if (helperId === profile.id) await checkBadgesOnComplete(profile.id, next);

    await refresh();
    setPayout(Number(req.payment_amount ?? 0));
    setRequesterName((req as any).requester?.name ?? "the caregiver");
    setBusy(false);

    if (profile.role === "volunteer") {
      setShowPayout(true);
    } else {
      toast.success("Task completed!");
      nav({ to: "/requests/$id/review", params: { id } });
    }
  };

  const closePayout = () => {
    setShowPayout(false);
    nav({ to: "/requests/$id/review", params: { id } });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="container-app pt-5 pb-3 flex items-center justify-between border-b">
        <Link to="/requests/$id" params={{ id }} className="size-10 grid place-items-center rounded-full">
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-primary font-bold text-lg">CareKampung</p>
        <div className="size-10" />
      </header>

      <div className="container-app pt-10 grid place-items-center text-center">
        <div className="size-14 rounded-full bg-primary-soft text-primary grid place-items-center">
          <Lock className="size-7" />
        </div>
        <h1 className="text-3xl font-bold mt-4">Enter End PIN</h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-xs">
          Ask the care recipient for their end PIN to confirm task completion.
        </p>
      </div>

      <div className="container-app mt-6">
        <div className="rounded-3xl bg-card shadow-card p-6 pb-8">
          <PinDisplay value={pin} />
          <div className="mt-6">
            <PinKeypad value={pin} onChange={setPin} />
          </div>

          <button
            onClick={verify}
            disabled={pin.length !== 4 || busy}
            className="mt-7 w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-5" />}
            Verify & Complete Task
          </button>
          <button className="mt-4 w-full text-primary text-sm font-semibold">
            Recipient forgot PIN?
          </button>
        </div>
      </div>

      {showPayout && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-5"
          onClick={closePayout}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card shadow-elevated p-6 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-16 rounded-full bg-success/15 text-success grid place-items-center mx-auto">
              <Wallet className="size-8" />
            </div>
            <h2 className="text-2xl font-bold mt-4 flex items-center justify-center gap-2">
              Payment Released <Sparkles className="size-5 text-warning" />
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {requesterName} has released your payment for completing the task.
            </p>
            <div className="mt-5 rounded-2xl bg-primary-soft text-primary py-5">
              <p className="text-xs uppercase tracking-wider font-semibold">You received</p>
              <p className="text-4xl font-bold mt-1">S${payout.toFixed(2)}</p>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Funds will appear in your linked account within 1–2 business days.
            </p>
            <button
              onClick={closePayout}
              className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated"
            >
              Continue to review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
