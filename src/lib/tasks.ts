import { ShoppingBasket, Car, Heart, Home, Footprints, Sparkles, type LucideIcon } from "lucide-react";

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
