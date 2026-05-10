import { useState } from "react";
import { Loader2, Sparkles, Copy, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { generateCareNote, CARE_NOTE_EXAMPLES } from "@/lib/seaLion";

type Props = {
  existingNotes: string;
  onUseNotes: (notes: string) => void;
};

export function CareNotesAssistant({ existingNotes, onUseNotes }: Props) {
  const [raw, setRaw] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!raw.trim()) {
      setError("Please enter a rough note first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { text } = await generateCareNote(raw.trim());
      setOutput(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate notes.");
      toast.error("Could not generate care notes");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Notes copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }

  function handleUse() {
    if (existingNotes.trim().length > 0) {
      const ok = window.confirm(
        "Append generated notes to existing notes? Click Cancel to replace instead."
      );
      if (ok) {
        onUseNotes(`${existingNotes.trim()}\n\n${output}`);
      } else {
        onUseNotes(output);
      }
    } else {
      onUseNotes(output);
    }
    toast.success("Notes added to request");
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary-soft/30 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="size-9 shrink-0 rounded-full bg-card text-primary grid place-items-center">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">AI Care Notes Assistant</p>
          <p className="text-xs text-muted-foreground">
            Turn rough caregiver notes into clear volunteer instructions.
          </p>
        </div>
      </div>

      <textarea
        rows={3}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="kinput resize-none w-full"
        placeholder="e.g. My ah ma speaks Mandarin and gets anxious when rushed…"
      />

      <div className="flex flex-wrap gap-2">
        {CARE_NOTE_EXAMPLES.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRaw(ex)}
            className="text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:bg-muted text-left max-w-full truncate"
            title={ex}
          >
            Example {i + 1}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {loading ? "Generating…" : "Generate Care Note"}
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
      )}

      {output && (
        <div className="space-y-2">
          <pre className="whitespace-pre-wrap text-xs leading-5 rounded-xl border border-border bg-card p-3 max-h-72 overflow-auto">
{output}
          </pre>
          <p className="text-[11px] text-muted-foreground italic">
            AI-generated notes are for low-risk volunteer support only. Volunteers should not provide medical care or administer medication.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-xl border border-border bg-card font-medium py-2 inline-flex items-center justify-center gap-2 text-sm"
            >
              <Copy className="size-4" /> Copy notes
            </button>
            <button
              type="button"
              onClick={handleUse}
              className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold py-2 inline-flex items-center justify-center gap-2 text-sm"
            >
              <ArrowDown className="size-4" /> Use in request notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
