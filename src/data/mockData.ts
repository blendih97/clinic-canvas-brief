export const kpiData = {
  totalRecords: 47,
  activeFlags: 3,
  countries: 4,
  activeMedications: 6,
};

export const bloodResults = [
  { id: "1", marker: "HbA1c", value: 5.4, unit: "%", range: "4.0–5.6", status: "normal" as const, trend: [5.2, 5.3, 5.1, 5.4], date: "2025-03-12", source: "Cleveland Clinic Abu Dhabi" },
  { id: "2", marker: "Total Cholesterol", value: 6.2, unit: "mmol/L", range: "< 5.2", status: "flagged" as const, trend: [5.1, 5.5, 5.8, 6.2], date: "2025-03-12", source: "Cleveland Clinic Abu Dhabi" },
  { id: "3", marker: "LDL Cholesterol", value: 4.1, unit: "mmol/L", range: "< 3.4", status: "flagged" as const, trend: [3.2, 3.5, 3.8, 4.1], date: "2025-03-12", source: "Cleveland Clinic Abu Dhabi" },
  { id: "4", marker: "HDL Cholesterol", value: 1.4, unit: "mmol/L", range: "> 1.0", status: "normal" as const, trend: [1.3, 1.4, 1.3, 1.4], date: "2025-03-12", source: "Cleveland Clinic Abu Dhabi" },
  { id: "5", marker: "TSH", value: 2.1, unit: "mIU/L", range: "0.4–4.0", status: "normal" as const, trend: [1.9, 2.0, 2.2, 2.1], date: "2025-01-18", source: "The London Clinic" },
  { id: "6", marker: "Vitamin D", value: 22, unit: "ng/mL", range: "30–100", status: "critical" as const, trend: [35, 30, 26, 22], date: "2025-01-18", source: "The London Clinic" },
  { id: "7", marker: "Ferritin", value: 85, unit: "ng/mL", range: "30–400", status: "normal" as const, trend: [90, 88, 82, 85], date: "2025-01-18", source: "The London Clinic" },
  { id: "8", marker: "CRP", value: 0.8, unit: "mg/L", range: "< 3.0", status: "normal" as const, trend: [1.2, 1.0, 0.9, 0.8], date: "2024-11-05", source: "Clinique La Colline, Geneva" },
];

export const imagingResults = [
  { id: "1", type: "MRI", region: "Lumbar Spine", date: "2025-02-20", facility: "HMC Doha", finding: "Mild disc desiccation at L4-L5 with a small posterior disc protrusion. No significant neural compression. Conus medullaris terminates normally.", status: "flagged" as const, originalLang: "Arabic" },
  { id: "2", type: "CT", region: "Chest", date: "2024-12-01", facility: "The London Clinic", finding: "No pulmonary nodules identified. Heart size normal. No pleural effusion. Incidental note of minor aortic root calcification.", status: "normal" as const, originalLang: "English" },
  { id: "3", type: "X-Ray", region: "Right Knee", date: "2024-09-15", facility: "Clinique La Colline, Geneva", finding: "Mild medial compartment joint space narrowing. No fracture or dislocation. Soft tissues appear normal.", status: "normal" as const, originalLang: "French" },
];

export const medications = [
  { id: "1", name: "Atorvastatin", dose: "20mg", frequency: "Once daily", prescriber: "Dr. Sarah Chen", facility: "The London Clinic", date: "2025-01-18", active: true },
  { id: "2", name: "Vitamin D3", dose: "4000 IU", frequency: "Once daily", prescriber: "Dr. Sarah Chen", facility: "The London Clinic", date: "2025-01-18", active: true },
  { id: "3", name: "Omeprazole", dose: "20mg", frequency: "Once daily (AM)", prescriber: "Dr. Ahmed Al-Rashid", facility: "Cleveland Clinic Abu Dhabi", date: "2024-11-20", active: true },
  { id: "4", name: "Amlodipine", dose: "5mg", frequency: "Once daily", prescriber: "Dr. Marc Dubois", facility: "Clinique La Colline, Geneva", date: "2024-09-15", active: true },
  { id: "5", name: "Aspirin", dose: "75mg", frequency: "Once daily", prescriber: "Dr. Sarah Chen", facility: "The London Clinic", date: "2024-06-10", active: true },
  { id: "6", name: "Melatonin", dose: "3mg", frequency: "As needed (sleep)", prescriber: "Dr. Sarah Chen", facility: "The London Clinic", date: "2024-06-10", active: true },
];

export const allergies = [
  { substance: "Penicillin", reaction: "Anaphylaxis", severity: "Severe" },
  { substance: "Shellfish", reaction: "Urticaria", severity: "Moderate" },
];

export const documents = [
  { id: "1", name: "Full Blood Panel - March 2025.pdf", type: "Blood Test", date: "2025-03-12", facility: "Cleveland Clinic Abu Dhabi", country: "UAE", pages: 4, extracted: true },
  { id: "2", name: "Lumbar MRI Report.pdf", type: "Imaging", date: "2025-02-20", facility: "HMC Doha", country: "Qatar", pages: 2, extracted: true },
  { id: "3", name: "Annual Health Screen.pdf", type: "Blood Test", date: "2025-01-18", facility: "The London Clinic", country: "UK", pages: 6, extracted: true },
  { id: "4", name: "CT Chest Report.pdf", type: "Imaging", date: "2024-12-01", facility: "The London Clinic", country: "UK", pages: 3, extracted: true },
  { id: "5", name: "Prescription - Statins.pdf", type: "Prescription", date: "2024-11-20", facility: "Cleveland Clinic Abu Dhabi", country: "UAE", pages: 1, extracted: true },
  { id: "6", name: "Knee X-Ray Report.pdf", type: "Imaging", date: "2024-09-15", facility: "Clinique La Colline, Geneva", country: "Switzerland", pages: 2, extracted: true },
  { id: "7", name: "Consultation Letter - Cardiology.pdf", type: "Clinical Letter", date: "2024-06-10", facility: "The London Clinic", country: "UK", pages: 3, extracted: true },
];

export const timelineEvents = [
  { date: "2025-03-12", title: "Blood Panel", detail: "Full blood count, lipids, metabolic panel", facility: "Cleveland Clinic Abu Dhabi", type: "blood" as const },
  { date: "2025-02-20", title: "Lumbar MRI", detail: "Mild disc protrusion L4-L5", facility: "HMC Doha", type: "imaging" as const },
  { date: "2025-01-18", title: "Annual Health Screen", detail: "Vitamin D deficiency identified", facility: "The London Clinic", type: "blood" as const },
  { date: "2024-12-01", title: "CT Chest", detail: "No significant findings", facility: "The London Clinic", type: "imaging" as const },
  { date: "2024-11-20", title: "Prescription Update", detail: "Atorvastatin 20mg initiated", facility: "Cleveland Clinic Abu Dhabi", type: "prescription" as const },
  { date: "2024-09-15", title: "Knee X-Ray", detail: "Mild OA changes, conservative management", facility: "Clinique La Colline, Geneva", type: "imaging" as const },
];

export const alerts = [
  { type: "critical" as const, message: "Vitamin D severely deficient (22 ng/mL). Supplementation initiated but levels continue to decline." },
  { type: "flagged" as const, message: "Total cholesterol trending upward over 12 months. LDL above target range despite statin therapy." },
  { type: "flagged" as const, message: "Disc protrusion L4-L5 identified. Monitor for progressive symptoms." },
];
