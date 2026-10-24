// Admin alert when document analysis fails. At most one email per hour:
// the platform_events row claims the hour, and the hour-bucket idempotency key
// stops duplicates if two failures race. No patient data is included.
// deno-lint-ignore no-explicit-any
type AdminClient = any;

const ALERT_EVENT = "analysis_failure_alert";

export async function notifyAnalysisFailure(
  admin: AdminClient,
  source: "analyse-document" | "public-translate-document" | "retry-document",
  error: string,
): Promise<void> {
  try {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await admin
      .from("platform_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", ALERT_EVENT)
      .gte("created_at", since);
    if ((count ?? 0) > 0) return;

    await admin.from("platform_events").insert({
      event_type: ALERT_EVENT,
      details_json: { source, error: error.slice(0, 500) },
    });

    const hourBucket = new Date().toISOString().slice(0, 13);
    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "analysis-failed-admin",
        recipientEmail: "info@rinvita.co.uk",
        idempotencyKey: `analysis-failed-${hourBucket}`,
        templateData: { source, error: error.slice(0, 500), failedAt: new Date().toISOString() },
      },
    });
  } catch (e) {
    console.error("analysis failure alert could not be sent", e);
  }
}
