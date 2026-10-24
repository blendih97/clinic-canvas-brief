// Writes an analyse-document result into the patient's structured tables.
// Used by retry-document (server-side retry of a failed upload).
// deno-lint-ignore-file no-explicit-any

export async function persistExtraction(
  supabase: any,
  userId: string,
  documentId: string,
  extracted: any,
  docDate: string,
  docFacility: string,
): Promise<void> {
  if (Array.isArray(extracted.bloodResults) && extracted.bloodResults.length) {
    const rows = extracted.bloodResults
      .filter((b: any) => b && b.marker && b.unit !== undefined && b.value !== undefined)
      .map((b: any) => ({
        user_id: userId, marker: String(b.marker), value: Number(b.value), unit: String(b.unit ?? ""),
        range: b.range ? String(b.range) : null, status: b.status || "normal",
        trend: Array.isArray(b.trend) ? b.trend : [], date: b.date || docDate, source: b.source || docFacility,
      }));
    if (rows.length) await supabase.from("blood_results").insert(rows);
  }
  if (Array.isArray(extracted.imagingResults) && extracted.imagingResults.length) {
    const rows = extracted.imagingResults.filter((i: any) => i && i.type).map((i: any) => ({
      user_id: userId, type: i.type, region: i.region || null, date: i.date || docDate,
      facility: i.facility || docFacility, finding: i.finding || null, status: i.status || "normal",
      original_lang: i.originalLang || null,
    }));
    if (rows.length) await supabase.from("imaging_results").insert(rows);
  }
  if (Array.isArray(extracted.medications) && extracted.medications.length) {
    const rows = extracted.medications.filter((m: any) => m && m.name).map((m: any) => ({
      user_id: userId, name: m.name, dose: m.dose || null, frequency: m.frequency || null,
      prescriber: m.prescriber || null, facility: m.facility || docFacility, date: m.date || docDate,
      active: m.active !== false, source: "ai",
    }));
    if (rows.length) await supabase.from("medications").insert(rows);
  }
  if (Array.isArray(extracted.allergies) && extracted.allergies.length) {
    const rows = extracted.allergies.filter((a: any) => a && a.substance).map((a: any) => ({
      user_id: userId, substance: a.substance, reaction: a.reaction || null, severity: a.severity || null, source: "ai",
    }));
    if (rows.length) await supabase.from("allergies").insert(rows);
  }
  if (Array.isArray(extracted.alerts) && extracted.alerts.length) {
    const rows = extracted.alerts.filter((a: any) => a && a.message).map((a: any) => ({
      user_id: userId, type: a.type || "flagged", message: a.message,
    }));
    if (rows.length) await supabase.from("alerts").insert(rows);
  }
  if (Array.isArray(extracted.visits) && extracted.visits.length) {
    const rows = extracted.visits
      .filter((v: any) => v && (v.visit_date || v.reason_for_visit || v.diagnosis || v.findings))
      .map((v: any) => ({
        user_id: userId, document_id: documentId, visit_date: v.visit_date || null,
        facility_name: v.facility_name || docFacility, facility_country: v.facility_country || null,
        reason_for_visit: v.reason_for_visit || null, investigations_performed: v.investigations_performed || [],
        findings: v.findings || null, diagnosis: v.diagnosis || null,
        medications_prescribed: v.medications_prescribed || [],
        follow_up_recommendations: v.follow_up_recommendations || [],
        original_lang: v.original_lang || null, source: "ai",
      }));
    if (rows.length) await supabase.from("visits").insert(rows);
  }
}
