import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_health_summary",
  title: "Get health summary",
  description:
    "Return a clinician-ready overview of the signed-in user: active medications, allergies, abnormal blood markers, recent visits and document counts.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const [meds, allergies, bloods, visits, documents] = await Promise.all([
      supabase.from("medications").select("name,dose,frequency,active").eq("active", true),
      supabase.from("allergies").select("substance,reaction,severity"),
      supabase.from("blood_results").select("marker,value,unit,range,status,date").neq("status", "normal").limit(25),
      supabase
        .from("visits")
        .select("visit_date,facility_name,facility_country,reason_for_visit,diagnosis")
        .order("visit_date", { ascending: false, nullsFirst: false })
        .limit(5),
      supabase.from("documents").select("id", { count: "exact", head: true }),
    ]);

    const firstError = [meds, allergies, bloods, visits, documents].find((r) => r.error)?.error;
    if (firstError) return { content: [{ type: "text", text: firstError.message }], isError: true };

    const summary = {
      active_medications: meds.data ?? [],
      allergies: allergies.data ?? [],
      abnormal_blood_markers: bloods.data ?? [],
      recent_visits: visits.data ?? [],
      document_count: documents.count ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
