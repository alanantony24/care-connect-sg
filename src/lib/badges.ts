import { supabase } from "@/integrations/supabase/client";

export const BADGE_DEFS = [
  { type: "first_responder", name: "First Responder", desc: "Claimed your first task" },
  { type: "helping_hand", name: "Helping Hand", desc: "Completed 5 tasks" },
  { type: "guardian_angel", name: "Guardian Angel", desc: "Completed 20 tasks" },
  { type: "early_bird", name: "Early Bird", desc: "Claimed within 1 hour of posting" },
  { type: "trusted_helper", name: "Trusted Helper", desc: "10 five-star ratings" },
] as const;

export type BadgeType = (typeof BADGE_DEFS)[number]["type"];

async function award(userId: string, badge: BadgeType) {
  // unique(user_id, badge_type) makes this idempotent — duplicate inserts will just error silently
  try {
    await supabase.from("badges").insert({ user_id: userId, badge_type: badge });
  } catch {
    // ignore
  }
}

export async function checkBadgesOnClaim(userId: string, postedAt: string) {
  // Count current badges
  const { data: existing } = await supabase
    .from("badges")
    .select("badge_type")
    .eq("user_id", userId);

  const has = new Set((existing ?? []).map((b) => b.badge_type));

  if (!has.has("first_responder")) {
    await award(userId, "first_responder");
  }
  // Early bird: claimed within 1h of posting
  if (!has.has("early_bird") && postedAt) {
    const ageMs = Date.now() - new Date(postedAt).getTime();
    if (ageMs <= 60 * 60 * 1000) await award(userId, "early_bird");
  }
}

export async function checkBadgesOnComplete(userId: string, tasksHelped: number) {
  if (tasksHelped >= 5) await award(userId, "helping_hand");
  if (tasksHelped >= 20) await award(userId, "guardian_angel");
}
