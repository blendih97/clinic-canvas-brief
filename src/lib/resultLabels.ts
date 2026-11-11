// Words shown for a lab or imaging result's status. They describe what the report says
// (a value against its reference range, or a finding the report marks as abnormal) rather
// than interpreting the result, so RinVita stays a records service, not a diagnostic tool.
export function resultStatusLabel(status: string | null | undefined): string {
  if (status === "critical") return "Well outside range";
  if (status === "flagged") return "Outside range";
  return "In range";
}
export function imagingStatusLabel(status: string | null | undefined): string {
  return status === "flagged" ? "Abnormal on report" : "Normal on report";
}
