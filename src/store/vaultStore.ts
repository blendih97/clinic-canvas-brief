import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BloodResult {
  id: string;
  marker: string;
  value: number;
  unit: string;
  range: string;
  status: "normal" | "flagged" | "critical";
  trend: number[];
  date: string;
  source: string;
}

export interface ImagingResult {
  id: string;
  type: string;
  region: string;
  date: string;
  facility: string;
  finding: string;
  status: "normal" | "flagged";
  originalLang: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  prescriber: string;
  facility: string;
  date: string;
  active: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  facility: string;
  country: string;
  pages: number;
  extracted: boolean;
  fileUrl?: string;
  summary?: string | string[];
  aiNote?: string;
}

export interface Alert {
  type: "critical" | "flagged";
  message: string;
}

export interface Allergy {
  substance: string;
  reaction: string;
  severity: string;
}

interface VaultState {
  bloodResults: BloodResult[];
  imagingResults: ImagingResult[];
  medications: Medication[];
  documents: Document[];
  alerts: Alert[];
  allergies: Allergy[];

  addBloodResults: (results: BloodResult[]) => void;
  addImagingResults: (results: ImagingResult[]) => void;
  addMedications: (meds: Medication[]) => void;
  addDocuments: (docs: Document[]) => void;
  addAlerts: (alerts: Alert[]) => void;
  addAllergies: (allergies: Allergy[]) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      bloodResults: [],
      imagingResults: [],
      medications: [],
      documents: [],
      alerts: [],
      allergies: [],

      addBloodResults: (results) =>
        set((state) => ({ bloodResults: [...state.bloodResults, ...results] })),
      addImagingResults: (results) =>
        set((state) => ({ imagingResults: [...state.imagingResults, ...results] })),
      addMedications: (meds) =>
        set((state) => ({ medications: [...state.medications, ...meds] })),
      addDocuments: (docs) =>
        set((state) => ({ documents: [...state.documents, ...docs] })),
      addAlerts: (alerts) =>
        set((state) => ({ alerts: [...state.alerts, ...alerts] })),
      addAllergies: (allergies) =>
        set((state) => ({ allergies: [...state.allergies, ...allergies] })),
    }),
    { name: "vault-health-store" }
  )
);
