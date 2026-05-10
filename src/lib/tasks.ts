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
      "border-emerald-200/20 bg-gradient-to-br from-emerald-950/90 via-teal-950/80 to-slate-950/85 text-emerald-50",
    icon: "bg-white/12 text-emerald-100 ring-1 ring-emerald-100/20 shadow-emerald-950/30",
    glow: "bg-emerald-400/25",
    text: "text-emerald-100",
    compact: "border-emerald-200/25 bg-emerald-950/75 text-emerald-100",
    section: "bg-emerald-950/80 text-emerald-100 ring-1 ring-emerald-200/20",
  },
  transport: {
    glass:
      "border-sky-200/20 bg-gradient-to-br from-sky-950/90 via-blue-950/80 to-slate-950/85 text-sky-50",
    icon: "bg-white/12 text-sky-100 ring-1 ring-sky-100/20 shadow-sky-950/30",
    glow: "bg-sky-400/25",
    text: "text-sky-100",
    compact: "border-sky-200/25 bg-sky-950/75 text-sky-100",
    section: "bg-sky-950/80 text-sky-100 ring-1 ring-sky-200/20",
  },
  companionship: {
    glass:
      "border-rose-200/20 bg-gradient-to-br from-rose-950/90 via-fuchsia-950/75 to-slate-950/85 text-rose-50",
    icon: "bg-white/12 text-rose-100 ring-1 ring-rose-100/20 shadow-rose-950/30",
    glow: "bg-rose-400/25",
    text: "text-rose-100",
    compact: "border-rose-200/25 bg-rose-950/75 text-rose-100",
    section: "bg-rose-950/80 text-rose-100 ring-1 ring-rose-200/20",
  },
  household: {
    glass:
      "border-violet-200/20 bg-gradient-to-br from-violet-950/90 via-purple-950/80 to-slate-950/85 text-violet-50",
    icon: "bg-white/12 text-violet-100 ring-1 ring-violet-100/20 shadow-violet-950/30",
    glow: "bg-violet-400/25",
    text: "text-violet-100",
    compact: "border-violet-200/25 bg-violet-950/75 text-violet-100",
    section: "bg-violet-950/80 text-violet-100 ring-1 ring-violet-200/20",
  },
  walk: {
    glass:
      "border-amber-200/20 bg-gradient-to-br from-amber-950/90 via-orange-950/80 to-slate-950/85 text-amber-50",
    icon: "bg-white/12 text-amber-100 ring-1 ring-amber-100/20 shadow-amber-950/30",
    glow: "bg-amber-400/25",
    text: "text-amber-100",
    compact: "border-amber-200/25 bg-amber-950/75 text-amber-100",
    section: "bg-amber-950/80 text-amber-100 ring-1 ring-amber-200/20",
  },
  errand: {
    glass:
      "border-indigo-200/20 bg-gradient-to-br from-indigo-950/90 via-cyan-950/70 to-slate-950/85 text-indigo-50",
    icon: "bg-white/12 text-indigo-100 ring-1 ring-indigo-100/20 shadow-indigo-950/30",
    glow: "bg-indigo-400/25",
    text: "text-indigo-100",
    compact: "border-indigo-200/25 bg-indigo-950/75 text-indigo-100",
    section: "bg-indigo-950/80 text-indigo-100 ring-1 ring-indigo-200/20",
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

export type Priority = "low" | "normal" | "high";

export const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; chip: string; ring: string; hint: string }
> = {
  low: {
    label: "Low",
    hint: "Flexible",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    ring: "border-emerald-500 bg-emerald-500/10 text-emerald-700",
  },
  normal: {
    label: "Normal",
    hint: "Standard",
    dot: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    ring: "border-amber-500 bg-amber-500/10 text-amber-700",
  },
  high: {
    label: "High",
    hint: "Urgent",
    dot: "bg-red-500",
    chip: "bg-red-500/15 text-red-600 border-red-500/30",
    ring: "border-red-500 bg-red-500/10 text-red-600",
  },
};

