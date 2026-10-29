import { jsPDF } from "jspdf";

// Fictional data only. This module has no persistence or network access.
export const DEMO_PATIENT = { name: "Eleanor Morgan", dob: "14 February 1979", age: 47, residence: "London, United Kingdom", bloodGroup: "O positive", id: "RV-DEMO-0047" };
export type DemoReport = { id: string; title: string; type: string; date: string; provider: string; language: string; summary: string; original: string; filename: string };
export const DEMO_REPORTS: DemoReport[] = [
  { id: "review", title: "Diabetes and medication review", type: "Consultation letter", date: "21 Oct 2026", provider: "Example London Medical Centre", language: "English", filename: "fictional-consultation.pdf", summary: "Type 2 diabetes reviewed. HbA1c 6.8%, down from 7.0% in August. Continue metformin 500 mg twice daily and atorvastatin 20 mg nightly. Mild iron deficiency anaemia: haemoglobin 116 g/L and ferritin 12 µg/L. Ferrous sulfate commenced; repeat blood count and ferritin in 8 weeks. Penicillin allergy documented.", original: "Dear Colleague,\nRe: Eleanor Morgan, DOB 14/02/1979\nReview of type 2 diabetes and recent blood results. HbA1c is 6.8%. Renal function remains stable. Mild iron deficiency anaemia noted. Ferrous sulfate 200 mg once daily prescribed. Repeat FBC and ferritin in 8 weeks. Further assessment of the cause of iron deficiency discussed.\nDr Alex Demo, General Practitioner" },
  { id: "blood", title: "Biochemistry and blood count", type: "Laboratory report", date: "18 Oct 2026", provider: "Example City Laboratory", language: "English", filename: "fictional-blood-panel.pdf", summary: "HbA1c 6.8% (high), haemoglobin 116 g/L (low), ferritin 12 µg/L (low). LDL cholesterol 2.4 mmol/L, creatinine 78 µmol/L and ALT 24 U/L within the stated laboratory intervals.", original: "Patient: Eleanor Morgan\nCollected: 18 October 2026\nHbA1c: 6.8% [4.0-6.0]\nHaemoglobin: 116 g/L [120-160]\nFerritin: 12 µg/L [15-150]\nLDL: 2.4 mmol/L [0-3.0]\nCreatinine: 78 µmol/L [45-90]\nALT: 24 U/L [0-35]\nAuthorised: Example City Laboratory" },
  { id: "mri", title: "MRI lumbar spine", type: "Imaging report", date: "14 Sep 2026", provider: "Example Lakeside Imaging", language: "English", filename: "fictional-mri-report.pdf", summary: "Indication: persistent mechanical lower back pain. Mild broad-based L4-L5 disc bulge without significant canal narrowing or nerve root compression. Vertebral alignment maintained. No acute osseous abnormality. This is a written report, not a scan viewer.", original: "MRI LUMBAR SPINE\nClinical indication: mechanical lower back pain.\nTechnique: sagittal T1/T2 and axial T2 sequences.\nFindings: maintained alignment. Mild L4-L5 broad-based disc bulge. No significant central canal stenosis or nerve root compression.\nImpression: mild L4-L5 degenerative disc change.\nDr Rowan Sample, Consultant Radiologist" },
  { id: "discharge", title: "Day surgery discharge summary", type: "Discharge summary", date: "03 Jun 2026", provider: "Example City Hospital", language: "English", filename: "fictional-discharge.pdf", summary: "Elective laparoscopic cholecystectomy for symptomatic gallstones. Uncomplicated recovery. Discharged home the same day. Wound review in 2 weeks. Paracetamol prescribed for 5 days as needed; course subsequently completed.", original: "DISCHARGE SUMMARY\nAdmission and discharge: 03 June 2026\nProcedure: laparoscopic cholecystectomy.\nCourse: uncomplicated. Tolerating oral intake and mobilising independently.\nDischarge medication: paracetamol 1 g up to four times daily as required, maximum 4 g/day, for 5 days.\nAllergy: penicillin, urticaria.\nMr Jamie Demo, Consultant Surgeon" },
  { id: "french", title: "French endocrinology report", type: "Consultation letter", date: "12 Mar 2026", provider: "Clinique Exemple, Lyon", language: "French", filename: "fictional-french-report.pdf", summary: "Type 2 diabetes follow-up. HbA1c 7.4%. Continue metformin 500 mg twice daily with meals. Renal function normal. Repeat HbA1c in 3 months. Penicillin allergy: hives.", original: "COMPTE RENDU DE CONSULTATION\nPatiente : Eleanor Morgan, née le 14/02/1979.\nSuivi du diabète de type 2. HbA1c : 7,4 %.\nPoursuite de la metformine 500 mg deux fois par jour, au cours des repas.\nFonction rénale normale. Contrôle de l'HbA1c dans trois mois.\nAllergie à la pénicilline : urticaire.\nDr Camille Exemple, endocrinologue." },
];
export const DEMO_LABS = [
  { id: "hba1c", name: "HbA1c", value: 6.8, unit: "%", low: 4, high: 6, group: "Diabetes monitoring", trend: [7.4, 7.0, 6.8], note: "Above the stated laboratory reference interval. Individual diabetes targets are agreed with the treating clinician." },
  { id: "ldl", name: "LDL cholesterol", value: 2.4, unit: "mmol/L", low: 0, high: 3, group: "Lipid profile", trend: [3.6, 2.8, 2.4], note: "Within this laboratory interval. Personal lipid targets may differ according to clinical context." },
  { id: "hb", name: "Haemoglobin", value: 116, unit: "g/L", low: 120, high: 160, group: "Full blood count", trend: [128, 121, 116], note: "Below the laboratory interval. Iron deficiency is documented in the 21 October consultation letter." },
  { id: "ferritin", name: "Ferritin", value: 12, unit: "µg/L", low: 15, high: 150, group: "Iron studies", trend: [26, 18, 12], note: "Below the laboratory interval. Follow-up blood tests are recorded in the consultation plan." },
  { id: "creatinine", name: "Creatinine", value: 78, unit: "µmol/L", low: 45, high: 90, group: "Renal function", trend: [80, 79, 78], note: "Within the stated laboratory interval." },
  { id: "alt", name: "ALT", value: 24, unit: "U/L", low: 0, high: 35, group: "Liver function", trend: [28, 26, 24], note: "Within the stated laboratory interval." },
];
export const DEMO_MEDS = [
  { name: "Metformin", dose: "500 mg", frequency: "Twice daily with meals", status: "Current", date: "Since Mar 2026", prescriber: "Dr Camille Exemple", source: "French endocrinology report, 12 Mar 2026", reason: "Type 2 diabetes" },
  { name: "Atorvastatin", dose: "20 mg", frequency: "Once daily at night", status: "Current", date: "Since Aug 2026", prescriber: "Dr Alex Demo", source: "Medication review, 21 Oct 2026", reason: "Lipid management" },
  { name: "Ferrous sulfate", dose: "200 mg", frequency: "Once daily", status: "Current", date: "Since 21 Oct 2026", prescriber: "Dr Alex Demo", source: "Consultation letter, 21 Oct 2026", reason: "Iron deficiency anaemia" },
  { name: "Paracetamol", dose: "1 g", frequency: "Up to four times daily as needed, maximum 4 g/day", status: "Completed", date: "03 to 08 Jun 2026", prescriber: "Mr Jamie Demo", source: "Discharge summary, 03 Jun 2026", reason: "Postoperative pain, 5-day course" },
];
export type ShareSection = "Reports" | "Labs" | "Medications" | "Allergies";
export const SHARE_SECTIONS: ShareSection[] = ["Reports", "Labs", "Medications", "Allergies"];
export function labFlag(value: number, low: number, high: number) { return value < low ? "Low" : value > high ? "High" : "In range"; }
export type DemoAccess = { code: string; expiresAt: number; used: boolean; sections: ShareSection[]; reports: DemoReport[] };
export function createDemoAccess(sections: ShareSection[], duration: number, reports: DemoReport[], now = Date.now()): DemoAccess {
  return { code: `DEMO-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`, expiresAt: now + duration, used: false, sections: [...sections], reports: [...reports] };
}
export function accessStatus(access: DemoAccess, now = Date.now()) { return access.used ? "used" : now >= access.expiresAt ? "expired" : "ready"; }
export function consumeDemoAccess(access: DemoAccess, now = Date.now()): DemoAccess | null { return accessStatus(access, now) === "ready" ? { ...access, used: true } : null; }
export function passportSections(selected: ShareSection[], reports: DemoReport[]) {
  return selected.map(section => ({ title: section, lines: section === "Reports" ? reports.map(r => `${r.title} | ${r.date} | ${r.provider}\n${r.summary}`) : section === "Labs" ? DEMO_LABS.map(l => `${l.name}: ${l.value} ${l.unit} | Reference ${l.low}-${l.high} | ${labFlag(l.value, l.low, l.high)}\nSource: Example City Laboratory, 18 Oct 2026`) : section === "Medications" ? DEMO_MEDS.filter(m => m.status === "Current").map(m => `${m.name} ${m.dose}, ${m.frequency}\nSource: ${m.source}`) : ["Penicillin: urticaria (hives). Recorded in French endocrinology report, 12 Mar 2026; reconfirmed in discharge summary, 03 Jun 2026."] }));
}
function plainPDF(text: string) { return text.replace(/µ/g, "u").replace(/[éèê]/g, "e").replace(/à/g, "a").replace(/î/g, "i"); }
export function buildDemoPDF(selected: ShareSection[], reports: DemoReport[], original?: DemoReport) {
  const pdf = new jsPDF();
  let y = 24;
  const line = (text: string, heading = false) => {
    pdf.setFont("helvetica", heading ? "bold" : "normal"); pdf.setFontSize(heading ? 13 : 10);
    const wrapped: string[] = pdf.splitTextToSize(plainPDF(text), 170);
    wrapped.forEach(part => { if (y > 265) { pdf.addPage(); y = 24; } pdf.text(part, 20, y); y += heading ? 7 : 5; });
    y += 4;
  };
  line("RinVita | FICTIONAL MEDICAL PASSPORT", true);
  line("FAKE TEST DATA. Fictional patient and providers. Not for clinical use.");
  line(`${DEMO_PATIENT.name} | DOB ${DEMO_PATIENT.dob} | ${DEMO_PATIENT.id}`);
  if (original) { line(`${original.title} | Source facsimile`, true); line(`${original.provider} | ${original.date} | ${original.language}`); line(original.original); }
  else passportSections(selected, reports).forEach(s => { line(s.title, true); s.lines.forEach(t => line(t)); });
  for (let p = 1; p <= pdf.getNumberOfPages(); p++) { pdf.setPage(p); pdf.setFontSize(8); pdf.text(`FICTIONAL DEMO ONLY | Not medical advice | Page ${p} of ${pdf.getNumberOfPages()}`, 20, 286); }
  return pdf;
}
