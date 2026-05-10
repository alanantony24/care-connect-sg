export interface Senior {
  id: string;
  name: string;
  age: number;
  sex: "Male" | "Female";
  bloodType: string;
  relation: string;
  desc: string;
  conditions: string[];
  accessibility: string[];
  emergencyContact: { name: string; phone: string };
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
    conditions: ["Mild arthritis", "Hearing aid"],
    accessibility: ["Walks slowly", "Hard of hearing — speak clearly"],
    emergencyContact: { name: "Sarah Lim", phone: "+65 9123 4567" },
    notes:
      "Loves morning walks around the void deck. Speaks Hokkien and English. Prefers a slow pace and a chat about her grandchildren.",
  },
  {
    id: "robert-m",
    name: "Robert M.",
    age: 82,
    sex: "Male",
    bloodType: "A+",
    relation: "Father-in-law",
    desc: "Weekly check-ins & mobility",
    conditions: ["Recovering from knee surgery", "Wears glasses"],
    accessibility: ["Uses a walking stick", "Needs help with stairs"],
    emergencyContact: { name: "Daniel Tan", phone: "+65 9876 5432" },
    notes:
      "Enjoys company at the kopitiam and reading the newspaper. Please greet by name to help orientation.",
  },
];

export function getSenior(id: string) {
  return SENIORS.find((s) => s.id === id) ?? null;
}
