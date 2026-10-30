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
      community_comments: {
        Row: {
          author_id: string
          author_name: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          author_name: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          author_name: string
          body: string
          category: string
          created_at: string
          id: string
          support_url: string | null
          tags: string[]
        }
        Insert: {
          author_id: string
          author_name: string
          body: string
          category?: string
          created_at?: string
          id?: string
          support_url?: string | null
          tags?: string[]
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          support_url?: string | null
          tags?: string[]
        }
        Relationships: []
      }
      community_reactions: {
        Row: {
          author_id: string
          post_id: string
          reaction: string
        }
        Insert: {
          author_id: string
          post_id: string
          reaction: string
        }
        Update: {
          author_id?: string
          post_id?: string
          reaction?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_scrape_jobs: {
        Row: {
          access_code: string
          created_at: string
          cursor: number
          error: string | null
          handle: string
          id: string
          platform: string
          posts: Json
          run_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_code: string
          created_at?: string
          cursor?: number
          error?: string | null
          handle: string
          id?: string
          platform: string
          posts?: Json
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          created_at?: string
          cursor?: number
          error?: string | null
          handle?: string
          id?: string
          platform?: string
          posts?: Json
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      long_form_operations: {
        Row: {
          lease_token: string | null
          lease_until: string | null
          long_form_id: string
          operation_key: string
          owner_id: string
          payload: Json
          state: string
          updated_at: string
        }
        Insert: {
          lease_token?: string | null
          lease_until?: string | null
          long_form_id: string
          operation_key: string
          owner_id: string
          payload?: Json
          state?: string
          updated_at?: string
        }
        Update: {
          lease_token?: string | null
          lease_until?: string | null
          long_form_id?: string
          operation_key?: string
          owner_id?: string
          payload?: Json
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      own_post_ai_access_blocks: {
        Row: {
          blocked_at: string
          model: string
          reason: string
        }
        Insert: {
          blocked_at?: string
          model: string
          reason: string
        }
        Update: {
          blocked_at?: string
          model?: string
          reason?: string
        }
        Relationships: []
      }
      pdf_extract_cache: {
        Row: {
          attachment_id: string
          byte_size: number | null
          created_at: string
          filename: string
          text: string
          updated_at: string
          url: string
        }
        Insert: {
          attachment_id: string
          byte_size?: number | null
          created_at?: string
          filename: string
          text: string
          updated_at?: string
          url: string
        }
        Update: {
          attachment_id?: string
          byte_size?: number | null
          created_at?: string
          filename?: string
          text?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      podcast_script_jobs: {
        Row: {
          counts: Json
          created_at: string
          error: string | null
          execution_id: string | null
          id: string
          long_form_id: string
          owner_id: string
          request: Json
          result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          counts?: Json
          created_at?: string
          error?: string | null
          execution_id?: string | null
          id?: string
          long_form_id: string
          owner_id: string
          request?: Json
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          counts?: Json
          created_at?: string
          error?: string | null
          execution_id?: string | null
          id?: string
          long_form_id?: string
          owner_id?: string
          request?: Json
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      podcast_unmatched_events: {
        Row: {
          created_at: string
          event: string
          execution_id: string | null
          id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          event: string
          execution_id?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          created_at?: string
          event?: string
          execution_id?: string | null
          id?: string
          payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_long_form_operation: {
        Args: {
          p_key: string
          p_long: string
          p_owner: string
          p_seconds?: number
          p_token: string
        }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
