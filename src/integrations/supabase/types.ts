export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details_json: Json
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details_json?: Json
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details_json?: Json
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          ai_model: string
          announcement_reply_to: string | null
          announcement_sender_name: string | null
          default_trial_days: number
          id: number
          updated_at: string
        }
        Insert: {
          ai_model?: string
          announcement_reply_to?: string | null
          announcement_sender_name?: string | null
          default_trial_days?: number
          id?: number
          updated_at?: string
        }
        Update: {
          ai_model?: string
          announcement_reply_to?: string | null
          announcement_sender_name?: string | null
          default_trial_days?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      allergies: {
        Row: {
          created_at: string
          id: string
          reaction: string | null
          severity: string | null
          source: string
          substance: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction?: string | null
          severity?: string | null
          source?: string
          substance: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction?: string | null
          severity?: string | null
          source?: string
          substance?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_results: {
        Row: {
          created_at: string
          date: string | null
          id: string
          marker: string
          range: string | null
          source: string | null
          status: string
          trend: Json | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          marker: string
          range?: string | null
          source?: string | null
          status?: string
          trend?: Json | null
          unit: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          marker?: string
          range?: string | null
          source?: string | null
          status?: string
          trend?: Json | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          ai_note: string | null
          country: string | null
          created_at: string
          date: string | null
          extracted: boolean | null
          facility: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          name: string
          original_language: string | null
          pages: number | null
          processed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string
          summary: Json | null
          type: string | null
          user_id: string
        }
        Insert: {
          ai_note?: string | null
          country?: string | null
          created_at?: string
          date?: string | null
          extracted?: boolean | null
          facility?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          name: string
          original_language?: string | null
          pages?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          summary?: Json | null
          type?: string | null
          user_id: string
        }
        Update: {
          ai_note?: string | null
          country?: string | null
          created_at?: string
          date?: string | null
          extracted?: boolean | null
          facility?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          name?: string
          original_language?: string | null
          pages?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          summary?: Json | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invited_at: string
          member_id: string | null
          owner_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invited_at?: string
          member_id?: string | null
          owner_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invited_at?: string
          member_id?: string | null
          owner_id?: string
          status?: string
        }
        Relationships: []
      }
      imaging_results: {
        Row: {
          created_at: string
          date: string | null
          facility: string | null
          finding: string | null
          id: string
          original_lang: string | null
          region: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          facility?: string | null
          finding?: string | null
          id?: string
          original_lang?: string | null
          region?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          facility?: string | null
          finding?: string | null
          id?: string
          original_lang?: string | null
          region?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      media_shares: {
        Row: {
          created_at: string
          expires_at: string
          file_path: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          file_path: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          file_path?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          date: string | null
          dose: string | null
          facility: string | null
          frequency: string | null
          id: string
          name: string
          prescriber: string | null
          source: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          date?: string | null
          dose?: string | null
          facility?: string | null
          frequency?: string | null
          id?: string
          name: string
          prescriber?: string | null
          source?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          date?: string | null
          dose?: string | null
          facility?: string | null
          frequency?: string | null
          id?: string
          name?: string
          prescriber?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          details_json: Json
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          details_json?: Json
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          details_json?: Json
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biological_sex: string | null
          blood_type: string | null
          comped_plan: string | null
          comped_until: string | null
          created_at: string
          current_diagnoses: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          health_data_consent_at: string | null
          height_cm: number | null
          id: string
          last_active_at: string | null
          nationality: string | null
          phone: string | null
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          suspended_at: string | null
          suspended_reason: string | null
          terms_consent_at: string | null
          trial_ends_at: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          biological_sex?: string | null
          blood_type?: string | null
          comped_plan?: string | null
          comped_until?: string | null
          created_at?: string
          current_diagnoses?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          health_data_consent_at?: string | null
          height_cm?: number | null
          id: string
          last_active_at?: string | null
          nationality?: string | null
          phone?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          terms_consent_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          biological_sex?: string | null
          blood_type?: string | null
          comped_plan?: string | null
          comped_until?: string | null
          created_at?: string
          current_diagnoses?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          health_data_consent_at?: string | null
          height_cm?: number | null
          id?: string
          last_active_at?: string | null
          nationality?: string | null
          phone?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          terms_consent_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      record_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          patient_name: string
          provider_email: string
          provider_name: string
          request_description: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          patient_name?: string
          provider_email: string
          provider_name: string
          request_description: string
          status?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          patient_name?: string
          provider_email?: string
          provider_name?: string
          request_description?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_briefs: {
        Row: {
          allergies: Json | null
          blood_results: Json | null
          created_at: string
          expires_at: string | null
          id: string
          imaging_results: Json | null
          medications: Json | null
          scope: string | null
          token: string
        }
        Insert: {
          allergies?: Json | null
          blood_results?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          imaging_results?: Json | null
          medications?: Json | null
          scope?: string | null
          token: string
        }
        Update: {
          allergies?: Json | null
          blood_results?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          imaging_results?: Json | null
          medications?: Json | null
          scope?: string | null
          token?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_dashboard_metrics: {
        Args: never
        Returns: {
          active_users: number
          churned_this_month: number
          mrr_gbp: number
          paying_users: number
          total_users: number
          trial_users: number
        }[]
      }
      get_admin_recent_documents: {
        Args: { _limit?: number }
        Returns: {
          document_id: string
          document_name: string
          document_type: string
          original_language: string
          processing_status: string
          upload_date: string
          user_id: string
          user_name: string
        }[]
      }
      get_admin_recent_signups: {
        Args: { _limit?: number }
        Returns: {
          country: string
          email: string
          full_name: string
          plan: string
          signup_date: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
