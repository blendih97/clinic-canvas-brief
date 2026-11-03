export function getBloodInsight(status: string, trend: number[], rangeIsTypical = false): string {
  if (rangeIsTypical && (status === "flagged" || status === "critical")) {
    return "Your laboratory marked this result as abnormal using its own reference range, which is not printed on the report. Ranges differ between laboratories, so discuss it with your doctor.";
  }
  const hasTrend = trend && trend.length > 1;
  const last = hasTrend ? trend[trend.length - 1] : 0;
  const prev = hasTrend ? trend[trend.length - 2] : 0;

  if (status === "critical") {
    return "This value is significantly outside the normal range — we recommend speaking with your doctor.";
  }
  if (status === "flagged") {
    return "This value is outside the normal range — worth discussing with your doctor.";
  }

  // Normal — check trend
  if (hasTrend && last > prev) {
    return "This value has increased since your last test — worth monitoring.";
  }
  if (hasTrend && last < prev) {
    return "This value has decreased since your last test.";
  }

  return rangeIsTypical
    ? "Your laboratory did not flag this result."
    : "This value is within the normal range provided by the laboratory.";
}

export function getImagingInsight(status: string): string {
  if (status === "flagged") {
    return "This finding is outside the normal range — worth discussing with your doctor.";
  }
  return "This value is within the normal range provided by the laboratory.";
}
