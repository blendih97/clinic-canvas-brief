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

export interface AdminUserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: string;
  created_at: string;
  last_active_at: string | null;
  trial_ends_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  comped_plan: string | null;
  comped_until: string | null;
  nationality: string | null;
  document_count: number;
  role: "admin" | "user";
}

export interface AdminActivityItem {
  id: string;
  event_type: string;
  created_at: string;
  user_id: string | null;
  actor_user_id: string | null;
  details_json: Record<string, unknown> | null;
  user_name: string | null;
  actor_name: string | null;
}

export interface AdminSettingsRecord {
  id: number;
  default_trial_days: number;
  ai_model: string;
  announcement_sender_name: string | null;
  announcement_reply_to: string | null;
  updated_at: string;
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

export async function getAdminUsers(params?: {
  search?: string;
  plan?: string;
  status?: string;
  limit?: number;
}) {
  const { data, error } = await rpc("get_admin_users", {
    _search: params?.search ?? null,
    _plan: params?.plan ?? null,
    _status: params?.status ?? null,
    _limit: params?.limit ?? 50,
  });

  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export async function updateAdminUserState(input: {
  targetUserId: string;
  suspended?: boolean | null;
  suspendedReason?: string | null;
  trialExtensionDays?: number | null;
  compedPlan?: string | null;
  compedUntil?: string | null;
}) {
  const { data, error } = await rpc("admin_update_user_state", {
    _target_user_id: input.targetUserId,
    _suspended: input.suspended ?? null,
    _suspended_reason: input.suspendedReason ?? null,
    _trial_extension_days: input.trialExtensionDays ?? null,
    _comped_plan: input.compedPlan ?? null,
    _comped_until: input.compedUntil ?? null,
  });

  if (error) throw error;
  return data;
}

export async function getAdminActivity(limit = 100) {
  const { data, error } = await rpc("get_admin_activity", { _limit: limit });
  if (error) throw error;
  return (data ?? []) as AdminActivityItem[];
}

export async function getAdminSettings() {
  const { data, error } = await rpc("get_admin_settings");
  if (error) throw error;
  return (data?.[0] ?? null) as AdminSettingsRecord | null;
}

export async function updateAdminSettings(input: {
  defaultTrialDays: number;
  aiModel: string;
  announcementSenderName: string;
  announcementReplyTo: string;
}) {
  const { data, error } = await rpc("admin_update_settings", {
    _default_trial_days: input.defaultTrialDays,
    _ai_model: input.aiModel,
    _announcement_sender_name: input.announcementSenderName,
    _announcement_reply_to: input.announcementReplyTo,
  });

  if (error) throw error;
  return data as AdminSettingsRecord;
}