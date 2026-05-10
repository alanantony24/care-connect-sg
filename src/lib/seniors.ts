export interface Senior {
  id: string;
  name: string;
  age: number;
  sex: "Male" | "Female";
  bloodType: string;
  relation: string;
  desc: string;
  health: string[];
  accessibility: string[];
  notes: string;
}

export const SENIORS: Senior[] = [
  {
    id: "eleanor-r",
    name: "Eleanor R.",
    age: 78,
    sex: "Female",
    bloodType: "O+",
    relation: "Mother",
    desc: "Daily assistance & companionship",
    health: ["Mild arthritis", "Low blood pressure"],
    accessibility: ["Wears a hearing aid", "Prefers slow walking pace"],
    notes:
      "Loves morning walks around the void deck. Speaks Hokkien and English. Please greet by name and chat about her grandchildren.",
  },
  {
    id: "robert-m",
    name: "Robert M.",
    age: 82,
    sex: "Male",
    bloodType: "A+",
    relation: "Father-in-law",
    desc: "Weekly check-ins & mobility",
    health: ["Recovering from knee surgery"],
    accessibility: ["Uses a walking stick", "Wears glasses"],
    notes:
      "Enjoys company at the kopitiam and reading the newspaper. Please greet by name to help orientation.",
  },
];

export function getSenior(id: string) {
  return SENIORS.find((s) => s.id === id) ?? null;
}
