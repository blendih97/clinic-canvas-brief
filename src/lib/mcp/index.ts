import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDocumentsTool from "./tools/list-documents";
import getDocumentTool from "./tools/get-document";
import listMedicationsTool from "./tools/list-medications";
import listBloodResultsTool from "./tools/list-blood-results";
import listAllergiesTool from "./tools/list-allergies";
import listVisitsTool from "./tools/list-visits";
import getHealthSummaryTool from "./tools/get-health-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "global-health-vault",
  title: "Global Health Vault",
  version: "0.1.0",
  instructions:
    "Read-only access to the signed-in user's RinVita health vault. Use get_health_summary for an overview, list_documents/get_document for uploaded and translated medical records, and list_medications, list_blood_results, list_allergies and list_visits for structured data. Never fabricate clinical information: report only what these tools return.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getHealthSummaryTool,
    listDocumentsTool,
    getDocumentTool,
    listMedicationsTool,
    listBloodResultsTool,
    listAllergiesTool,
    listVisitsTool,
  ],
});
