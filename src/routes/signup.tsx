import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Upload, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Field, Style } from "./login";
import { LocationPicker, type PickedLocation } from "@/components/LocationPicker";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up · Komunity" }] }),
  component: SignupPage,
});

const LANGUAGE_SUGGESTIONS = ["English", "Mandarin", "Malay", "Tamil", "Hokkien", "Cantonese", "Teochew"];

function SignupPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [name, setName] = useState("");
  const [role, setRole] = useState<"caregiver" | "volunteer">("caregiver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 (volunteer only)
  const [age, setAge] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [motivation, setMotivation] = useState("");
  const [emergency, setEmergency] = useState("");
  const [notes, setNotes] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  const [langInput, setLangInput] = useState("");
  const [busy, setBusy] = useState(false);

  const addLang = (raw: string) => {
    const l = raw.trim();
    if (!l) return;
    setLanguages((prev) => (prev.includes(l) ? prev : [...prev, l]));
    setLangInput("");
  };
  const removeLang = (l: string) => setLanguages((prev) => prev.filter((x) => x !== l));


  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "volunteer") {
      setStep(2);
    } else {
      void doSignup();
    }
  };

  const doSignup = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name, role },
      },
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    if (!data.session) {
      setBusy(false);
      toast.success("Check your email to confirm your account.");
      nav({ to: "/login" });
      return;
    }

    // Volunteer extras
    if (role === "volunteer" && data.user) {
      let certUrl: string | null = null;
      let certStatus: "none" | "pending" = "none";
      if (certFile) {
        const ext = certFile.name.split(".").pop() || "pdf";
        const path = `${data.user.id}/cert-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("certifications")
          .upload(path, certFile, { contentType: certFile.type, upsert: true });
        if (!upErr) {
          certUrl = path;
          certStatus = "pending";
        }
      }
      await supabase
        .from("profiles")
        .update({
          age: age ? parseInt(age, 10) : null,
          languages: languages.length ? languages : null,
          experience: experience || null,
          preferred_area: location?.label ?? null,
          preferred_lat: location?.lat ?? null,
          preferred_lng: location?.lng ?? null,
          motivation: motivation || null,
          emergency_contact: emergency || null,
          notes: notes || null,
          cert_url: certUrl,
          cert_status: certStatus,
        })
        .eq("id", data.user.id);
    }

    setBusy(false);
    nav({ to: role === "volunteer" ? "/volunteer" : "/dashboard" });
  };

  return (
    <div className="min-h-screen container-app pt-6 pb-10 flex flex-col">
      <button
        type="button"
        onClick={() => (step === 2 ? setStep(1) : nav({ to: "/" }))}
        className="size-10 grid place-items-center rounded-full bg-card border"
      >
        <ArrowLeft className="size-5" />
      </button>

      {step === 1 ? (
        <>
          <h1 className="text-3xl font-bold mt-8">Join Komunity</h1>
          <p className="text-muted-foreground mt-1">
            Help your kampung — or get help with daily tasks.
          </p>

          <form onSubmit={onContinue} className="mt-8 space-y-4">
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
              <span className="block text-sm font-medium mb-1.5">I am a</span>
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
                    <p className="font-semibold">{r === "caregiver" ? "Caregiver" : "Volunteer"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r === "caregiver" ? "Post care tasks" : "Apply for tasks"}
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
              {busy && <Loader2 className="size-4 animate-spin" />}
              {role === "volunteer" ? "Continue" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold">
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mt-8">Tell us about you</h1>
          <p className="text-muted-foreground mt-1">
            This helps caregivers match you to the right tasks.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void doSignup();
            }}
            className="mt-8 space-y-5"
          >
            <Field label="Age">
              <input
                required
                type="number"
                min={16}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="kinput"
                placeholder="e.g. 28"
              />
            </Field>

            <div>
              <span className="block text-sm font-medium mb-1.5">Languages you speak</span>
              <div className="flex flex-wrap gap-2 mb-2">
                {languages.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground border-primary border px-3 py-1 text-sm"
                  >
                    {l}
                    <button
                      type="button"
                      onClick={() => removeLang(l)}
                      aria-label={`Remove ${l}`}
                      className="opacity-80 hover:opacity-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addLang(langInput);
                    }
                  }}
                  className="kinput flex-1"
                  placeholder="Type a language and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addLang(langInput)}
                  className="rounded-full bg-card border px-4 text-sm font-semibold"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LANGUAGE_SUGGESTIONS.filter((s) => !languages.includes(s)).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => addLang(s)}
                    className="text-xs rounded-full border px-2.5 py-1 text-muted-foreground hover:text-foreground"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium mb-1.5">
                Professional certifications (optional)
              </span>
              <label className="flex items-center gap-3 rounded-2xl border bg-card p-3 cursor-pointer hover:border-primary/40">
                {certFile ? (
                  <FileCheck className="size-5 text-primary" />
                ) : (
                  <Upload className="size-5 text-muted-foreground" />
                )}
                <span className="text-sm flex-1 truncate">
                  {certFile ? certFile.name : "Upload PDF or image"}
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Reviewed by admin within 3–5 working days. Status will show as Pending until
                verified.
              </p>
            </div>

            <Field label="Previous related experience">
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="kinput min-h-24"
                placeholder="e.g. Helped at a nursing home for 6 months"
              />
            </Field>

            <div>
              <span className="block text-sm font-medium mb-1.5">Preferred location / area</span>
              <LocationPicker
                value={location}
                onChange={setLocation}
                placeholder="Search neighbourhood, MRT, postal code"
              />
            </div>

            <Field label="Why do you want to volunteer?">
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                className="kinput min-h-24"
                placeholder="Share what motivates you"
              />
            </Field>

            <Field label="Emergency contact">
              <input
                value={emergency}
                onChange={(e) => setEmergency(e.target.value)}
                className="kinput"
                placeholder="Name and phone number"
              />
            </Field>

            <Field label="Notes (anything you're not comfortable with?)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="kinput min-h-20"
                placeholder="Optional — e.g. allergies, lifting limits"
              />
            </Field>

            <button
              disabled={busy}
              className="w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Create account
            </button>
          </form>
        </>
      )}

      <Style />
    </div>
  );
}
