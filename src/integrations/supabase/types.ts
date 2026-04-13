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
          substance: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction?: string | null
          severity?: string | null
          substance: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction?: string | null
          severity?: string | null
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
          file_url: string | null
          id: string
          name: string
          pages: number | null
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
          file_url?: string | null
          id?: string
          name: string
          pages?: number | null
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
          file_url?: string | null
          id?: string
          name?: string
          pages?: number | null
          summary?: Json | null
          type?: string | null
          user_id?: string
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
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          nationality: string | null
          phone: string | null
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id: string
          nationality?: string | null
          phone?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          phone?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
