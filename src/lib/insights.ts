export function getBloodInsight(status: string, trend: number[], rangeIsTypical = false, outsideTypical: boolean | null = null): string {
  if (rangeIsTypical && (status === "flagged" || status === "critical") && outsideTypical === true) {
    return "This value is outside a typical UK adult reference range. Your report did not print the laboratory's own range, so check it with your doctor.";
  }
  if (rangeIsTypical && (status === "flagged" || status === "critical")) {
    return "Your report marks this result as outside the laboratory's own reference range, which is not printed on the report. Ranges differ between laboratories, so check it with your doctor.";
  }
  const hasTrend = trend && trend.length > 1;
  const last = hasTrend ? trend[trend.length - 1] : 0;
  const prev = hasTrend ? trend[trend.length - 2] : 0;

  if (status === "critical") {
    return "Your report shows this value well outside its reference range. Check it with your doctor.";
  }
  if (status === "flagged") {
    return "Your report shows this value outside its reference range. Check it with your doctor.";
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
    : "This value is within the reference range on your report.";
}

export function getImagingInsight(status: string): string {
  if (status === "flagged") {
    return "Your report describes this finding as abnormal. Check it with your doctor.";
  }
  return "This value is within the reference range on your report.";
}
