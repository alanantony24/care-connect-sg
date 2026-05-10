import {
  ShoppingBasket,
  Car,
  Heart,
  Home,
  Footprints,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type TaskType = "grocery" | "transport" | "companionship" | "household" | "walk" | "errand";

export const TASK_TYPES: { value: TaskType; label: string; icon: LucideIcon }[] = [
  { value: "grocery", label: "Grocery", icon: ShoppingBasket },
  { value: "transport", label: "Transport", icon: Car },
  { value: "companionship", label: "Companionship", icon: Heart },
  { value: "household", label: "Household", icon: Home },
  { value: "walk", label: "Walk", icon: Footprints },
  { value: "errand", label: "Errand", icon: Sparkles },
];

export function taskMeta(t: string) {
  return TASK_TYPES.find((x) => x.value === t) ?? TASK_TYPES[0];
}

export type Priority = "low" | "normal" | "high";

export const PRIORITY_META: Record<Priority, { label: string; dot: string; chip: string; ring: string }> = {
  low: {
    label: "Low",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    ring: "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  normal: {
    label: "Normal",
    dot: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    ring: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  high: {
    label: "High",
    dot: "bg-red-500",
    chip: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    ring: "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

export function priorityMeta(p?: string | null): { label: string; dot: string; chip: string; ring: string } {
  return PRIORITY_META[(p as Priority) || "normal"] ?? PRIORITY_META.normal;
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
