export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      galleries: {
        Row: {
          cover_image_id: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_app_gallery: boolean
          is_default: boolean
          is_public: boolean
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_id?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_app_gallery?: boolean
          is_default?: boolean
          is_public?: boolean
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_id?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_app_gallery?: boolean
          is_default?: boolean
          is_public?: boolean
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "galleries_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "galleries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_page_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          ends_at: string | null
          gallery_id: string
          id: string
          is_active: boolean
          page_slug: string
          starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          ends_at?: string | null
          gallery_id: string
          id?: string
          is_active?: boolean
          page_slug: string
          starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          ends_at?: string | null
          gallery_id?: string
          id?: string
          is_active?: boolean
          page_slug?: string
          starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_page_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_page_assignments_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_media_items: {
        Row: {
          added_at: string | null
          added_by: string | null
          gallery_id: string
          id: string
          media_item_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          gallery_id: string
          id?: string
          media_item_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          gallery_id?: string
          id?: string
          media_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_media_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_media_items_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_media_items_media_item_id_fkey"
            columns: ["media_item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          bucket_id: string
          camera_make: string | null
          camera_model: string | null
          conversion_metadata: Json | null
          created_at: string
          date_taken: string | null
          description: string | null
          duration: string | null
          exif_data: Json | null
          file_path: string
          file_size: number | null
          filename: string
          height: number | null
          id: string
          imagekit_file_id: string | null
          imagekit_url: string | null
          is_public: boolean | null
          lat: number | null
          location_name: string | null
          lon: number | null
          media_type: string
          mime_type: string
          original_filename: string
          original_format: string | null
          project_name: string | null
          source: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          uploader_id: string | null
          was_converted: boolean | null
          width: number | null
        }
        Insert: {
          bucket_id?: string
          camera_make?: string | null
          camera_model?: string | null
          conversion_metadata?: Json | null
          created_at?: string
          date_taken?: string | null
          description?: string | null
          duration?: string | null
          exif_data?: Json | null
          file_path: string
          file_size?: number | null
          filename: string
          height?: number | null
          id?: string
          imagekit_file_id?: string | null
          imagekit_url?: string | null
          is_public?: boolean | null
          lat?: number | null
          location_name?: string | null
          lon?: number | null
          media_type?: string
          mime_type: string
          original_filename: string
          original_format?: string | null
          project_name?: string | null
          source?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          uploader_id?: string | null
          was_converted?: boolean | null
          width?: number | null
        }
        Update: {
          bucket_id?: string
          camera_make?: string | null
          camera_model?: string | null
          conversion_metadata?: Json | null
          created_at?: string
          date_taken?: string | null
          description?: string | null
          duration?: string | null
          exif_data?: Json | null
          file_path?: string
          file_size?: number | null
          filename?: string
          height?: number | null
          id?: string
          imagekit_file_id?: string | null
          imagekit_url?: string | null
          is_public?: boolean | null
          lat?: number | null
          location_name?: string | null
          lon?: number | null
          media_type?: string
          mime_type?: string
          original_filename?: string
          original_format?: string | null
          project_name?: string | null
          source?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          uploader_id?: string | null
          was_converted?: boolean | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_items_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          app_role: string
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          app_role?: string
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          app_role?: string
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_default_gallery: {
        Args: { p_user_id: string }
        Returns: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

