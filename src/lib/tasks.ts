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
    amount: 25,
    range: "S$20-S$30",
    reason: "Appointment escort takes more coordination and waiting time than a simple errand.",
  },
  companionship: {
    amount: 10,
    range: "S$8-S$12",
    reason: "Companionship is lower physical effort but still asks for focused time and care.",
  },
  household: {
    amount: 15,
    range: "S$12-S$18",
    reason: "Light household support may involve standing, carrying, or simple cleanup.",
  },
  walk: {
    amount: 12,
    range: "S$10-S$15",
    reason: "A supervised walk needs patience, attention, and safe return home.",
  },
  errand: {
    amount: 10,
    range: "S$8-S$12",
    reason: "Simple errands are usually quick and low-risk when instructions are clear.",
  },
};

export function paymentGuidance(t: TaskType) {
  return TASK_PAYMENT_GUIDANCE[t];
}
