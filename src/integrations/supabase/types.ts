export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      commission_settings: {
        Row: {
          applies_to_project_types: string[] | null
          commission_rate: number
          commission_type: string
          created_at: string
          effective_from: string
          effective_until: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          maximum_commission: number | null
          minimum_commission: number | null
        }
        Insert: {
          applies_to_project_types?: string[] | null
          commission_rate?: number
          commission_type?: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          maximum_commission?: number | null
          minimum_commission?: number | null
        }
        Update: {
          applies_to_project_types?: string[] | null
          commission_rate?: number
          commission_type?: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          maximum_commission?: number | null
          minimum_commission?: number | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_notes: string | null
          complainant_evidence: Json | null
          complainant_id: string
          created_at: string
          dispute_reason: string
          escrow_id: string
          id: string
          project_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          respondent_evidence: Json | null
          respondent_id: string
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          complainant_evidence?: Json | null
          complainant_id: string
          created_at?: string
          dispute_reason: string
          escrow_id: string
          id?: string
          project_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          respondent_evidence?: Json | null
          respondent_id: string
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          complainant_evidence?: Json | null
          complainant_id?: string
          created_at?: string
          dispute_reason?: string
          escrow_id?: string
          id?: string
          project_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          respondent_evidence?: Json | null
          respondent_id?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_complainant_id_fkey"
            columns: ["complainant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_holdings: {
        Row: {
          auto_release_date: string | null
          client_id: string
          created_at: string
          freelancer_amount: number
          freelancer_id: string | null
          held_amount: number
          hold_reason: string | null
          id: string
          platform_commission: number
          project_id: string
          release_conditions: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          transaction_id: string
          updated_at: string
        }
        Insert: {
          auto_release_date?: string | null
          client_id: string
          created_at?: string
          freelancer_amount: number
          freelancer_id?: string | null
          held_amount: number
          hold_reason?: string | null
          id?: string
          platform_commission?: number
          project_id: string
          release_conditions?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          transaction_id: string
          updated_at?: string
        }
        Update: {
          auto_release_date?: string | null
          client_id?: string
          created_at?: string
          freelancer_amount?: number
          freelancer_id?: string | null
          held_amount?: number
          hold_reason?: string | null
          id?: string
          platform_commission?: number
          project_id?: string
          release_conditions?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_holdings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holdings_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holdings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holdings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          icon: string | null
          id: string
          message: string
          notification_type: string
          priority: Database["public"]["Enums"]["notification_priority"] | null
          project_id: string | null
          read: boolean
          recipient_id: string | null
          recipient_role: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message: string
          notification_type: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          project_id?: string | null
          read?: boolean
          recipient_id?: string | null
          recipient_role?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message?: string
          notification_type?: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          project_id?: string | null
          read?: boolean
          recipient_id?: string | null
          recipient_role?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          is_verified: boolean
          method_type: Database["public"]["Enums"]["payment_method"]
          nickname: string | null
          phone_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_verified?: boolean
          method_type: Database["public"]["Enums"]["payment_method"]
          nickname?: string | null
          phone_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_verified?: boolean
          method_type?: Database["public"]["Enums"]["payment_method"]
          nickname?: string | null
          phone_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          mpesa_transaction_id: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
          transaction_id: string | null
          webhook_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          payload: Json
          processed?: boolean
          processed_at?: string | null
          transaction_id?: string | null
          webhook_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          transaction_id?: string | null
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_to: string | null
          available_for_bidding: boolean | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          client_id: string | null
          created_at: string | null
          deadline: string | null
          deadline_reminder_sent: boolean | null
          deadline_warning_sent: boolean | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["project_status"] | null
          submission_date: string | null
          submission_notes: string | null
          submission_status: string | null
          submission_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          available_for_bidding?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deadline_reminder_sent?: boolean | null
          deadline_warning_sent?: boolean | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          submission_date?: string | null
          submission_notes?: string | null
          submission_status?: string | null
          submission_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          available_for_bidding?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deadline_reminder_sent?: boolean | null
          deadline_warning_sent?: boolean | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          submission_date?: string | null
          submission_notes?: string | null
          submission_status?: string | null
          submission_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          bid_amount: number
          cover_letter: string | null
          created_at: string | null
          estimated_days: number | null
          freelancer_id: string | null
          id: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bid_amount: number
          cover_letter?: string | null
          created_at?: string | null
          estimated_days?: number | null
          freelancer_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bid_amount?: number
          cover_letter?: string | null
          created_at?: string | null
          estimated_days?: number | null
          freelancer_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          mpesa_receipt_number: string | null
          mpesa_transaction_id: string | null
          payer_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone_number: string | null
          project_id: string
          recipient_id: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mpesa_receipt_number?: string | null
          mpesa_transaction_id?: string | null
          payer_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone_number?: string | null
          project_id: string
          recipient_id?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mpesa_receipt_number?: string | null
          mpesa_transaction_id?: string | null
          payer_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          phone_number?: string | null
          project_id?: string
          recipient_id?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recipient_id_fkey"
            columns: ["recipient_id"]
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
      admin_approve_project: {
        Args: { project_id: string }
        Returns: {
          assigned_to: string | null
          available_for_bidding: boolean | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          client_id: string | null
          created_at: string | null
          deadline: string | null
          deadline_reminder_sent: boolean | null
          deadline_warning_sent: boolean | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["project_status"] | null
          submission_date: string | null
          submission_notes: string | null
          submission_status: string | null
          submission_url: string | null
          title: string
          updated_at: string | null
        }[]
      }
      admin_assign_project: {
        Args: { p_project_id: string; p_freelancer_id: string }
        Returns: {
          assigned_to: string | null
          available_for_bidding: boolean | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          client_id: string | null
          created_at: string | null
          deadline: string | null
          deadline_reminder_sent: boolean | null
          deadline_warning_sent: boolean | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["project_status"] | null
          submission_date: string | null
          submission_notes: string | null
          submission_status: string | null
          submission_url: string | null
          title: string
          updated_at: string | null
        }[]
      }
      days_until_deadline: {
        Args: { deadline_date: string }
        Returns: number
      }
      handle_admin_approve_project: {
        Args: { project_id: string }
        Returns: {
          success: boolean
          message: string
          data: Json
        }[]
      }
      is_deadline_passed: {
        Args: { deadline_date: string }
        Returns: boolean
      }
      update_project_deadline_flag: {
        Args: { project_id: string; flag_name: string; flag_value: boolean }
        Returns: undefined
      }
    }
    Enums: {
      dispute_status: "open" | "investigating" | "resolved" | "closed"
      escrow_status: "held" | "released" | "disputed" | "refunded"
      notification_priority: "low" | "medium" | "high" | "urgent"
      payment_method: "mpesa_stk" | "mpesa_paybill" | "mpesa_tillnumber"
      project_status:
        | "pending_approval"
        | "open"
        | "in_progress"
        | "completed"
        | "canceled"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
      transaction_type:
        | "payment"
        | "payout"
        | "commission"
        | "refund"
        | "penalty"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dispute_status: ["open", "investigating", "resolved", "closed"],
      escrow_status: ["held", "released", "disputed", "refunded"],
      notification_priority: ["low", "medium", "high", "urgent"],
      payment_method: ["mpesa_stk", "mpesa_paybill", "mpesa_tillnumber"],
      project_status: [
        "pending_approval",
        "open",
        "in_progress",
        "completed",
        "canceled",
      ],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      transaction_type: [
        "payment",
        "payout",
        "commission",
        "refund",
        "penalty",
      ],
    },
  },
} as const
