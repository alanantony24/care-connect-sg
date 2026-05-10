import { supabase } from "@/integrations/supabase/client";

// AI Care Notes Assistant helper.
// Calls the backend function so Cloudflare credentials stay private.

const SYSTEM_PROMPT = `You are helping a caregiver in Singapore prepare safe, clear instructions for a volunteer who will support a low-risk, non-medical caregiving task.

The volunteer is NOT allowed to administer medication, perform medical procedures, lift or transfer the senior, handle intimate care, or supervise high-risk medical conditions alone.

Convert the caregiver's informal note into clear volunteer-friendly instructions.

Be culturally aware for Singapore and Southeast Asia. Preserve useful local context such as ah ma, ah gong, preferred language, dialect, communication style, routines, and behavioural preferences.

Return the answer as plain text with these headings:
Summary
Preferred language
Mobility notes
Communication tips
Things to avoid
Safety reminders`;

function detectLanguage(note: string): string {
  const n = note.toLowerCase();
  if (n.includes("mandarin") || n.includes("chinese") || n.includes("ah ma") || n.includes("ah gong")) return "Mandarin";
  if (n.includes("malay") || n.includes("bahasa")) return "Malay";
  if (n.includes("tamil")) return "Tamil";
  if (n.includes("hokkien")) return "Hokkien";
  if (n.includes("cantonese")) return "Cantonese";
  if (n.includes("teochew")) return "Teochew";
  if (n.includes("english")) return "English";
  return "Not specified — please confirm with caregiver";
}

function localFallback(rawNote: string): string {
  const note = rawNote.trim();
  const lang = detectLanguage(note);
  const lower = note.toLowerCase();

  const mobility: string[] = [];
  if (lower.includes("cane") || lower.includes("walker") || lower.includes("wheelchair")) {
    mobility.push("Senior uses a mobility aid — walk at their pace and stay close.");
  }
  if (lower.includes("slow") || lower.includes("tired") || lower.includes("break")) {
    mobility.push("Walk slowly and offer rest breaks as needed.");
  }
  if (mobility.length === 0) mobility.push("Walk at a comfortable pace for the senior.");

  const comms: string[] = ["Speak calmly and clearly", "Use simple, friendly language"];
  if (lower.includes("anxious") || lower.includes("rush")) comms.push("Avoid rushing the senior");
  if (lower.includes("quiet")) comms.push("Keep conversation gentle and quiet");

  const avoid: string[] = [];
  if (lower.includes("hospital")) avoid.push("Avoid mentioning hospital visits directly");
  if (lower.includes("anxious")) avoid.push("Avoid sudden changes or pressure");
  if (avoid.length === 0) avoid.push("Avoid topics that may upset or confuse the senior");

  const summary = note.length > 0
    ? `Volunteer support task. Key context: ${note.length > 140 ? note.slice(0, 137) + "…" : note}`
    : "Volunteer support task for a senior in Singapore.";

  return [
    "Summary:",
    summary,
    "",
    "Preferred language:",
    lang,
    "",
    "Mobility notes:",
    ...mobility.map((m) => `- ${m}`),
    "",
    "Communication tips:",
    ...comms.map((c) => `- ${c}`),
    "",
    "Things to avoid:",
    ...avoid.map((a) => `- ${a}`),
    "",
    "Safety reminders:",
    "- Stay beside the senior while walking",
    "- Contact the caregiver if the senior seems distressed",
    "- Volunteers should not administer medication or provide medical care",
  ].join("\n");
}

export async function generateCareNote(rawNote: string): Promise<{ text: string; source: "sea-lion" | "fallback" }> {
  const { data, error } = await supabase.functions.invoke("care-notes", {
    body: { rawNote },
  });

  if (error) {
    throw new Error(error.message || "AI service could not generate notes.");
  }

  if (!data?.text) {
    throw new Error(data?.error || "AI returned an empty response.");
  }

  return { text: data.text, source: "sea-lion" };
}

export const CARE_NOTE_EXAMPLES = [
  "My ah ma speaks Mandarin and gets anxious when rushed. Please walk slowly and avoid mentioning hospital visits directly.",
  "My father walks with a cane and prefers Malay. He likes quiet conversation and may need reminders to drink water.",
  "My grandmother understands Tamil better than English. She gets tired after 20 minutes of walking, so please take breaks.",
];
