import { createFileRoute, Link, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { PinDisplay, PinKeypad } from "@/components/PinPad";
import { toast } from "sonner";
import { checkBadgesOnComplete } from "@/lib/badges";

export const Route = createFileRoute("/requests/$id/end")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: EndPin,
});

function EndPin() {
  const { id } = useParams({ from: "/requests/$id/end" });
  const { profile, refresh } = useSession();
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [actualPin, setActualPin] = useState<string | null>(null);
  const [claimedBy, setClaimedBy] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("requests")
      .select("end_pin, claimed_by")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setActualPin(data?.end_pin ?? null);
        setClaimedBy(data?.claimed_by ?? null);
      });
  }, [id]);

  const verify = async () => {
    if (pin.length !== 4 || !profile) return;
    setBusy(true);
    if (pin !== actualPin) {
      setBusy(false);
      setPin("");
      toast.error("Incorrect PIN.");
      return;
    }
    await supabase
      .from("requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);

    const helperId = claimedBy ?? profile.id;
    const { data: helperProfile } = await supabase
      .from("profiles")
      .select("tasks_helped")
      .eq("id", helperId)
      .maybeSingle();
    const next = (helperProfile?.tasks_helped ?? 0) + 1;
    await supabase.from("profiles").update({ tasks_helped: next }).eq("id", helperId);
    if (helperId === profile.id) await checkBadgesOnComplete(profile.id, next);

    await refresh();
    toast.success("Task completed!");
    nav({ to: "/requests/$id/review", params: { id } });
    setBusy(false);
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
    </div>
  );
}
