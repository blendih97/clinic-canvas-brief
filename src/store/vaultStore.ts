import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

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
  loading: boolean;

  loadUserData: (userId: string) => Promise<void>;
  clearData: () => void;
  addBloodResults: (results: BloodResult[], userId: string) => Promise<void>;
  addImagingResults: (results: ImagingResult[], userId: string) => Promise<void>;
  addMedications: (meds: Medication[], userId: string) => Promise<void>;
  addDocuments: (docs: Document[], userId: string) => Promise<void>;
  addAlerts: (alerts: Alert[], userId: string) => Promise<void>;
  addAllergies: (allergies: Allergy[], userId: string) => Promise<void>;
}

export const useVaultStore = create<VaultState>()((set) => ({
  bloodResults: [],
  imagingResults: [],
  medications: [],
  documents: [],
  alerts: [],
  allergies: [],
  loading: false,

  loadUserData: async (userId: string) => {
    set({ loading: true });
    const [blood, imaging, meds, docs, alerts, allergies] = await Promise.all([
      supabase.from("blood_results").select("*").eq("user_id", userId),
      supabase.from("imaging_results").select("*").eq("user_id", userId),
      supabase.from("medications").select("*").eq("user_id", userId),
      supabase.from("documents").select("*").eq("user_id", userId),
      supabase.from("alerts").select("*").eq("user_id", userId),
      supabase.from("allergies").select("*").eq("user_id", userId),
    ]);

    set({
      bloodResults: (blood.data || []).map((r: any) => ({
        id: r.id, marker: r.marker, value: Number(r.value), unit: r.unit, range: r.range || "",
        status: r.status as "normal" | "flagged" | "critical",
        trend: Array.isArray(r.trend) ? r.trend : [], date: r.date || "", source: r.source || "",
      })),
      imagingResults: (imaging.data || []).map((r: any) => ({
        id: r.id, type: r.type, region: r.region || "", date: r.date || "", facility: r.facility || "",
        finding: r.finding || "", status: r.status as "normal" | "flagged", originalLang: r.original_lang || "",
      })),
      medications: (meds.data || []).map((r: any) => ({
        id: r.id, name: r.name, dose: r.dose || "", frequency: r.frequency || "",
        prescriber: r.prescriber || "", facility: r.facility || "", date: r.date || "", active: r.active,
      })),
      documents: (docs.data || []).map((r: any) => ({
        id: r.id, name: r.name, type: r.type || "", date: r.date || "", facility: r.facility || "",
        country: r.country || "", pages: r.pages || 1, extracted: r.extracted || false,
        fileUrl: r.file_url || undefined, summary: r.summary || undefined, aiNote: r.ai_note || undefined,
      })),
      alerts: (alerts.data || []).map((r: any) => ({
        type: r.type as "critical" | "flagged", message: r.message,
      })),
      allergies: (allergies.data || []).map((r: any) => ({
        substance: r.substance, reaction: r.reaction || "", severity: r.severity || "",
      })),
      loading: false,
    });
  },

  clearData: () => set({
    bloodResults: [], imagingResults: [], medications: [], documents: [], alerts: [], allergies: [],
  }),

  addBloodResults: async (results, userId) => {
    const rows = results.map((r) => ({
      user_id: userId, marker: r.marker, value: r.value, unit: r.unit, range: r.range,
      status: r.status, trend: r.trend, date: r.date, source: r.source,
    }));
    const { data } = await supabase.from("blood_results").insert(rows).select();
    if (data) {
      const mapped = data.map((r: any) => ({
        id: r.id, marker: r.marker, value: Number(r.value), unit: r.unit, range: r.range || "",
        status: r.status, trend: Array.isArray(r.trend) ? r.trend : [], date: r.date || "", source: r.source || "",
      }));
      set((s) => ({ bloodResults: [...s.bloodResults, ...mapped] }));
    }
  },

  addImagingResults: async (results, userId) => {
    const rows = results.map((r) => ({
      user_id: userId, type: r.type, region: r.region, date: r.date, facility: r.facility,
      finding: r.finding, status: r.status, original_lang: r.originalLang,
    }));
    const { data } = await supabase.from("imaging_results").insert(rows).select();
    if (data) {
      const mapped = data.map((r: any) => ({
        id: r.id, type: r.type, region: r.region || "", date: r.date || "", facility: r.facility || "",
        finding: r.finding || "", status: r.status, originalLang: r.original_lang || "",
      }));
      set((s) => ({ imagingResults: [...s.imagingResults, ...mapped] }));
    }
  },

  addMedications: async (meds, userId) => {
    const rows = meds.map((m) => ({
      user_id: userId, name: m.name, dose: m.dose, frequency: m.frequency,
      prescriber: m.prescriber, facility: m.facility, date: m.date, active: m.active,
    }));
    const { data } = await supabase.from("medications").insert(rows).select();
    if (data) {
      const mapped = data.map((r: any) => ({
        id: r.id, name: r.name, dose: r.dose || "", frequency: r.frequency || "",
        prescriber: r.prescriber || "", facility: r.facility || "", date: r.date || "", active: r.active,
      }));
      set((s) => ({ medications: [...s.medications, ...mapped] }));
    }
  },

  addDocuments: async (docs, userId) => {
    const rows = docs.map((d) => ({
      user_id: userId, name: d.name, type: d.type, date: d.date, facility: d.facility,
      country: d.country, pages: d.pages, extracted: d.extracted, file_url: d.fileUrl,
      summary: d.summary ? (Array.isArray(d.summary) ? d.summary : [d.summary]) : null,
      ai_note: d.aiNote,
    }));
    const { data } = await supabase.from("documents").insert(rows).select();
    if (data) {
      const mapped = data.map((r: any) => ({
        id: r.id, name: r.name, type: r.type || "", date: r.date || "", facility: r.facility || "",
        country: r.country || "", pages: r.pages || 1, extracted: r.extracted || false,
        fileUrl: r.file_url || undefined, summary: r.summary || undefined, aiNote: r.ai_note || undefined,
      }));
      set((s) => ({ documents: [...s.documents, ...mapped] }));
    }
  },

  addAlerts: async (newAlerts, userId) => {
    const rows = newAlerts.map((a) => ({
      user_id: userId, type: a.type, message: a.message,
    }));
    await supabase.from("alerts").insert(rows);
    set((s) => ({ alerts: [...s.alerts, ...newAlerts] }));
  },

  addAllergies: async (newAllergies, userId) => {
    const rows = newAllergies.map((a) => ({
      user_id: userId, substance: a.substance, reaction: a.reaction, severity: a.severity,
    }));
    await supabase.from("allergies").insert(rows);
    set((s) => ({ allergies: [...s.allergies, ...newAllergies] }));
  },
}));
