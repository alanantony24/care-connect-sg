export interface Senior {
  id: string;
  name: string;
  age: number;
  relation: string;
  desc: string;
  conditions: string[];
  preferredTimes: string;
  address: string;
  emergencyContact: { name: string; phone: string };
  notes: string;
}

export const SENIORS: Senior[] = [
  {
    id: "eleanor-r",
    name: "Eleanor R.",
    age: 78,
    relation: "Mother",
    desc: "Daily assistance & companionship",
    conditions: ["Mild arthritis", "Hearing aid"],
    preferredTimes: "Mornings, 9–11 AM",
    address: "Block 102, Ang Mo Kio Ave 3",
    emergencyContact: { name: "Sarah Lim", phone: "+65 9123 4567" },
    notes:
      "Loves morning walks around the void deck. Speaks Hokkien and English. Prefers a slow pace and a chat about her grandchildren.",
  },
  {
    id: "robert-m",
    name: "Robert M.",
    age: 82,
    relation: "Father-in-law",
    desc: "Weekly check-ins & mobility",
    conditions: ["Recovering from knee surgery", "Wears glasses"],
    preferredTimes: "Afternoons, 2–4 PM",
    address: "Block 215, Bishan Street 23",
    emergencyContact: { name: "Daniel Tan", phone: "+65 9876 5432" },
    notes:
      "Uses a walking stick. Enjoys company at the kopitiam and reading the newspaper. Please greet by name to help orientation.",
  },
];

export function getSenior(id: string) {
  return SENIORS.find((s) => s.id === id) ?? null;
}
