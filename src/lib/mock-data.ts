export type Role = "caregiver" | "volunteer" | "admin";

export interface Senior {
  id: string;
  name: string;
  age: number;
  photo: string;
  language: string;
  conditions: string[];
  mobility: "Independent" | "Walking aid" | "Wheelchair";
  emergencyContact: { name: string; phone: string; relation: string };
  caregiverRelation: string;
  exercisePref: string;
  careNotes: string[];
  fallRisk: "Low" | "Medium" | "High";
  preferredHospital: string;
  allergies: string[];
}

export interface Appointment {
  id: string;
  seniorId: string;
  type: "Dialysis" | "Physiotherapy" | "Checkup" | "Exercise";
  title: string;
  datetime: string;
  location: string;
  notes?: string;
  itemsToBring?: string[];
  needsEscort: boolean;
}

export interface Medication {
  id: string;
  seniorId: string;
  name: string;
  dosage: string;
  timing: string;
  food: "before" | "after" | "any";
  remaining: number;
  refillAt: number;
}

export interface HelpRequest {
  id: string;
  seniorId: string;
  category:
    | "Exercise accompaniment"
    | "Appointment escort"
    | "Grocery assistance"
    | "Companionship"
    | "Medication reminder";
  title: string;
  datetime: string;
  durationMin: number;
  location: string;
  area: string; // SG region
  instructions: string;
  status: "open" | "accepted" | "completed";
  acceptedBy?: string;
  rating?: number;
}

export interface Volunteer {
  id: string;
  name: string;
  photo: string;
  area: string;
  rating: number;
  tasksDone: number;
  verified: boolean;
}

const today = new Date();
const iso = (daysAhead: number, h = 9, m = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const seniors: Senior[] = [
  {
    id: "s1",
    name: "Tan Ah Kow",
    age: 78,
    photo: "👴",
    language: "Mandarin / Hokkien",
    conditions: ["Type 2 Diabetes", "Mild hypertension"],
    mobility: "Walking aid",
    emergencyContact: { name: "Wei Ming Tan", phone: "+65 9123 4567", relation: "Son" },
    caregiverRelation: "Son",
    exercisePref: "Morning walk at Bishan Park",
    careNotes: [
      "Gets anxious when rushed — speak slowly",
      "Prefers Mandarin / Hokkien",
      "Avoid discussing medical issues directly",
    ],
    fallRisk: "Medium",
    preferredHospital: "Tan Tock Seng Hospital",
    allergies: ["Penicillin"],
  },
  {
    id: "s2",
    name: "Siti Aminah",
    age: 72,
    photo: "👵",
    language: "Malay / English",
    conditions: ["Chronic kidney disease (Stage 4)", "Arthritis"],
    mobility: "Independent",
    emergencyContact: { name: "Nurul Aminah", phone: "+65 9876 5432", relation: "Daughter" },
    caregiverRelation: "Daughter",
    exercisePref: "Light stretching at home",
    careNotes: [
      "Dialysis 3x weekly — gets tired easily",
      "Bring water and light snack",
      "Prays at Maghrib — avoid scheduling 7pm",
    ],
    fallRisk: "Low",
    preferredHospital: "National University Hospital",
    allergies: [],
  },
];

export const appointments: Appointment[] = [
  {
    id: "a1",
    seniorId: "s2",
    type: "Dialysis",
    title: "Dialysis session",
    datetime: iso(0, 14, 0),
    location: "NUH Dialysis Centre, Kent Ridge",
    notes: "Session ~4 hours. Bring blanket, snack.",
    itemsToBring: ["IC", "Medical card", "Light snack", "Water"],
    needsEscort: true,
  },
  {
    id: "a2",
    seniorId: "s1",
    type: "Physiotherapy",
    title: "Physio — knee mobility",
    datetime: iso(1, 10, 30),
    location: "Bishan Polyclinic",
    notes: "Wear loose pants and supportive shoes.",
    itemsToBring: ["Walking aid", "Appointment card"],
    needsEscort: true,
  },
  {
    id: "a3",
    seniorId: "s1",
    type: "Checkup",
    title: "Diabetes review",
    datetime: iso(5, 9, 0),
    location: "Tan Tock Seng Hospital",
    needsEscort: false,
  },
];

export const medications: Medication[] = [
  { id: "m1", seniorId: "s1", name: "Metformin", dosage: "500mg", timing: "8:00 AM", food: "after", remaining: 18, refillAt: 7 },
  { id: "m2", seniorId: "s1", name: "Amlodipine", dosage: "5mg", timing: "8:00 AM", food: "any", remaining: 5, refillAt: 7 },
  { id: "m3", seniorId: "s2", name: "Calcium + Vit D", dosage: "1 tab", timing: "9:00 AM", food: "after", remaining: 24, refillAt: 10 },
];

export const requests: HelpRequest[] = [
  {
    id: "r1",
    seniorId: "s1",
    category: "Exercise accompaniment",
    title: "Morning walk at Bishan Park",
    datetime: iso(1, 7, 0),
    durationMin: 60,
    location: "Bishan-AMK Park, Entrance C",
    area: "Bishan",
    instructions: "Walk slowly, take breaks at benches. Speaks Hokkien.",
    status: "open",
  },
  {
    id: "r2",
    seniorId: "s2",
    category: "Appointment escort",
    title: "Escort to dialysis at NUH",
    datetime: iso(0, 13, 30),
    durationMin: 300,
    location: "NUH Dialysis Centre",
    area: "Kent Ridge",
    instructions: "Bring wheelchair from lobby. Patient prefers Malay.",
    status: "accepted",
    acceptedBy: "v1",
  },
  {
    id: "r3",
    seniorId: "s1",
    category: "Companionship",
    title: "Afternoon companionship & tea",
    datetime: iso(2, 15, 0),
    durationMin: 90,
    location: "Block 234 Bishan St 22",
    area: "Bishan",
    instructions: "Loves discussing old Singapore stories.",
    status: "open",
  },
  {
    id: "r4",
    seniorId: "s2",
    category: "Grocery assistance",
    title: "Help with NTUC grocery run",
    datetime: iso(3, 10, 0),
    durationMin: 60,
    location: "NTUC FairPrice Clementi",
    area: "Clementi",
    instructions: "Shopping list will be provided. Halal items only.",
    status: "open",
  },
];

export const volunteers: Volunteer[] = [
  { id: "v1", name: "Aisha Rahman", photo: "🧕", area: "Clementi", rating: 4.9, tasksDone: 47, verified: true },
  { id: "v2", name: "Daniel Lim", photo: "🧑", area: "Bishan", rating: 4.8, tasksDone: 32, verified: true },
  { id: "v3", name: "Priya Krishnan", photo: "👩", area: "Toa Payoh", rating: 4.95, tasksDone: 61, verified: true },
];

export const taskCategories = [
  "Exercise accompaniment",
  "Appointment escort",
  "Grocery assistance",
  "Companionship",
  "Medication reminder",
] as const;
