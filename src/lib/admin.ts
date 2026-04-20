import { supabase } from "@/integrations/supabase/client";

export interface AdminDashboardMetrics {
  total_users: number;
  active_users: number;
  trial_users: number;
  paying_users: number;
  mrr_gbp: number;
  churned_this_month: number;
}

export interface AdminRecentSignup {
  user_id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  plan: string;
  signup_date: string;
}

export interface AdminRecentDocument {
  document_id: string;
  user_id: string;
  user_name: string;
  document_name: string;
  document_type: string | null;
  original_language: string | null;
  upload_date: string;
  processing_status: string;
}

const rpc = supabase.rpc.bind(supabase) as (...args: any[]) => Promise<any>;

export async function checkAdminAccess(userId: string): Promise<boolean> {
  const { data, error } = await rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function getAdminDashboardData() {
  const [metricsResult, signupsResult, documentsResult] = await Promise.all([
    rpc("get_admin_dashboard_metrics"),
    rpc("get_admin_recent_signups", { _limit: 10 }),
    rpc("get_admin_recent_documents", { _limit: 10 }),
  ]);

  if (metricsResult.error) throw metricsResult.error;
  if (signupsResult.error) throw signupsResult.error;
  if (documentsResult.error) throw documentsResult.error;

  return {
    metrics: (metricsResult.data?.[0] ?? {
      total_users: 0,
      active_users: 0,
      trial_users: 0,
      paying_users: 0,
      mrr_gbp: 0,
      churned_this_month: 0,
    }) as AdminDashboardMetrics,
    recentSignups: (signupsResult.data ?? []) as AdminRecentSignup[],
    recentDocuments: (documentsResult.data ?? []) as AdminRecentDocument[],
  };
}