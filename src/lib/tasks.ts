import {
  ShoppingBag,
  CarFront,
  HeartHandshake,
  HousePlus,
  Footprints,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export type TaskType = "grocery" | "transport" | "companionship" | "household" | "walk" | "errand";

export const TASK_TYPES: { value: TaskType; label: string; icon: LucideIcon }[] = [
  { value: "grocery", label: "Grocery", icon: ShoppingBag },
  { value: "transport", label: "Transport", icon: CarFront },
  { value: "companionship", label: "Companionship", icon: HeartHandshake },
  { value: "household", label: "Household", icon: HousePlus },
  { value: "walk", label: "Walk", icon: Footprints },
  { value: "errand", label: "Errand", icon: WandSparkles },
];

export function taskMeta(t: string) {
  return TASK_TYPES.find((x) => x.value === t) ?? TASK_TYPES[0];
}

export const TASK_BADGE_STYLES: Record<
  TaskType,
  {
    glass: string;
    icon: string;
    glow: string;
    text: string;
    compact: string;
    section: string;
  }
> = {
  grocery: {
    glass:
      "border-lime-200/40 bg-gradient-to-br from-lime-100 via-lime-50 to-yellow-50 text-lime-900 dark:from-lime-950/60 dark:via-lime-900/40 dark:to-slate-950/60 dark:text-lime-50 dark:border-lime-200/15",
    icon: "bg-lime-200/70 text-lime-800 ring-1 ring-lime-300/40 dark:bg-white/10 dark:text-lime-100 dark:ring-lime-100/15",
    glow: "bg-lime-300/40",
    text: "text-lime-900 dark:text-lime-100",
    compact: "border-lime-300/50 bg-lime-100 text-lime-800 dark:border-lime-200/20 dark:bg-lime-950/50 dark:text-lime-100",
    section: "bg-lime-100 text-lime-800 ring-1 ring-lime-300/50 dark:bg-lime-950/50 dark:text-lime-100 dark:ring-lime-200/15",
  },
  transport: {
    glass:
      "border-sky-200/40 bg-gradient-to-br from-sky-100 via-sky-50 to-blue-50 text-sky-900 dark:from-sky-950/60 dark:via-blue-900/40 dark:to-slate-950/60 dark:text-sky-50 dark:border-sky-200/15",
    icon: "bg-sky-200/70 text-sky-800 ring-1 ring-sky-300/40 dark:bg-white/10 dark:text-sky-100 dark:ring-sky-100/15",
    glow: "bg-sky-300/40",
    text: "text-sky-900 dark:text-sky-100",
    compact: "border-sky-300/50 bg-sky-100 text-sky-800 dark:border-sky-200/20 dark:bg-sky-950/50 dark:text-sky-100",
    section: "bg-sky-100 text-sky-800 ring-1 ring-sky-300/50 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-200/15",
  },
  companionship: {
    glass:
      "border-rose-200/40 bg-gradient-to-br from-rose-100 via-pink-50 to-fuchsia-50 text-rose-900 dark:from-rose-950/60 dark:via-fuchsia-900/40 dark:to-slate-950/60 dark:text-rose-50 dark:border-rose-200/15",
    icon: "bg-rose-200/70 text-rose-800 ring-1 ring-rose-300/40 dark:bg-white/10 dark:text-rose-100 dark:ring-rose-100/15",
    glow: "bg-rose-300/40",
    text: "text-rose-900 dark:text-rose-100",
    compact: "border-rose-300/50 bg-rose-100 text-rose-800 dark:border-rose-200/20 dark:bg-rose-950/50 dark:text-rose-100",
    section: "bg-rose-100 text-rose-800 ring-1 ring-rose-300/50 dark:bg-rose-950/50 dark:text-rose-100 dark:ring-rose-200/15",
  },
  household: {
    glass:
      "border-violet-200/40 bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-50 text-violet-900 dark:from-violet-950/60 dark:via-purple-900/40 dark:to-slate-950/60 dark:text-violet-50 dark:border-violet-200/15",
    icon: "bg-violet-200/70 text-violet-800 ring-1 ring-violet-300/40 dark:bg-white/10 dark:text-violet-100 dark:ring-violet-100/15",
    glow: "bg-violet-300/40",
    text: "text-violet-900 dark:text-violet-100",
    compact: "border-violet-300/50 bg-violet-100 text-violet-800 dark:border-violet-200/20 dark:bg-violet-950/50 dark:text-violet-100",
    section: "bg-violet-100 text-violet-800 ring-1 ring-violet-300/50 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-200/15",
  },
  walk: {
    glass:
      "border-amber-200/40 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50 text-amber-900 dark:from-amber-950/60 dark:via-orange-900/40 dark:to-slate-950/60 dark:text-amber-50 dark:border-amber-200/15",
    icon: "bg-amber-200/70 text-amber-800 ring-1 ring-amber-300/40 dark:bg-white/10 dark:text-amber-100 dark:ring-amber-100/15",
    glow: "bg-amber-300/40",
    text: "text-amber-900 dark:text-amber-100",
    compact: "border-amber-300/50 bg-amber-100 text-amber-800 dark:border-amber-200/20 dark:bg-amber-950/50 dark:text-amber-100",
    section: "bg-amber-100 text-amber-800 ring-1 ring-amber-300/50 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-200/15",
  },
  errand: {
    glass:
      "border-indigo-200/40 bg-gradient-to-br from-indigo-100 via-cyan-50 to-blue-50 text-indigo-900 dark:from-indigo-950/60 dark:via-cyan-900/40 dark:to-slate-950/60 dark:text-indigo-50 dark:border-indigo-200/15",
    icon: "bg-indigo-200/70 text-indigo-800 ring-1 ring-indigo-300/40 dark:bg-white/10 dark:text-indigo-100 dark:ring-indigo-100/15",
    glow: "bg-indigo-300/40",
    text: "text-indigo-900 dark:text-indigo-100",
    compact: "border-indigo-300/50 bg-indigo-100 text-indigo-800 dark:border-indigo-200/20 dark:bg-indigo-950/50 dark:text-indigo-100",
    section: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300/50 dark:bg-indigo-950/50 dark:text-indigo-100 dark:ring-indigo-200/15",
  },
};

export function taskBadgeStyle(t: string) {
  return TASK_BADGE_STYLES[taskMeta(t).value];
}

export const MAX_TASK_PAYMENT = 15;
export const PLATFORM_FEE_RATE = 0.05;

export const TASK_PAYMENT_GUIDANCE: Record<
  TaskType,
  { amount: number; range: string; reason: string }
> = {
  grocery: {
    amount: 12,
    range: "S$10-S$15",
    reason: "A short grocery run usually takes under an hour, with some carrying involved.",
  },
  transport: {
    amount: 15,
    range: "S$13-S$15",
    reason:
      "Transport and appointment escort need more waiting time and coordination, so they sit at the top of the range.",
  },
  companionship: {
    amount: 9,
    range: "S$8-S$10",
    reason: "Companionship is lower physical effort but still asks for focused time and care.",
  },
  household: {
    amount: 11,
    range: "S$10-S$12",
    reason: "Light household support may involve standing, carrying, or simple cleanup.",
  },
  walk: {
    amount: 8,
    range: "S$6-S$9",
    reason: "A supervised walk needs patience, attention, and safe return home.",
  },
  errand: {
    amount: 10,
    range: "S$8-S$11",
    reason: "Simple errands are usually quick and low-risk when instructions are clear.",
  },
};

export function paymentGuidance(t: TaskType) {
  return TASK_PAYMENT_GUIDANCE[t];
}

export function clampTaskPayment(amount: number) {
  return Math.min(Math.max(amount, 0), MAX_TASK_PAYMENT);
}

export function platformFeeFor(amount: number) {
  return Number((clampTaskPayment(amount) * PLATFORM_FEE_RATE).toFixed(2));
}

export function volunteerPayoutFor(amount: number) {
  return Number((clampTaskPayment(amount) - platformFeeFor(amount)).toFixed(2));
}
