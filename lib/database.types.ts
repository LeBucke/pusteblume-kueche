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
    PostgrestVersion: "14.18"
  }
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
      ingredients: {
        Row: {
          aliases: string[]
          allergens: string[]
          allergens_checked: boolean
          archived: boolean
          created_at: string
          default_unit: string | null
          id: string
          name: string
          notes: string | null
          product_group_id: string | null
          supplier_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          aliases?: string[]
          allergens?: string[]
          allergens_checked?: boolean
          archived?: boolean
          created_at?: string
          default_unit?: string | null
          id?: string
          name: string
          notes?: string | null
          product_group_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          aliases?: string[]
          allergens?: string[]
          allergens_checked?: boolean
          archived?: boolean
          created_at?: string
          default_unit?: string | null
          id?: string
          name?: string
          notes?: string | null
          product_group_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_product_group_id_fkey"
            columns: ["product_group_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_feedback: {
        Row: {
          amount_rating: string | null
          course: Database["public"]["Enums"]["course"]
          created_at: string
          created_by: string | null
          date: string
          liked: string | null
          note: string | null
          updated_at: string
        }
        Insert: {
          amount_rating?: string | null
          course: Database["public"]["Enums"]["course"]
          created_at?: string
          created_by?: string | null
          date: string
          liked?: string | null
          note?: string | null
          updated_at?: string
        }
        Update: {
          amount_rating?: string | null
          course?: Database["public"]["Enums"]["course"]
          created_at?: string
          created_by?: string | null
          date?: string
          liked?: string | null
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_days: {
        Row: {
          adults: number | null
          children: number | null
          closed: boolean
          closed_reason: string | null
          created_at: string
          date: string
          note_internal: string | null
          note_public: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adults?: number | null
          children?: number | null
          closed?: boolean
          closed_reason?: string | null
          created_at?: string
          date: string
          note_internal?: string | null
          note_public?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adults?: number | null
          children?: number | null
          closed?: boolean
          closed_reason?: string | null
          created_at?: string
          date?: string
          note_internal?: string | null
          note_public?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      plan_meals: {
        Row: {
          course: Database["public"]["Enums"]["course"]
          created_at: string
          date: string
          recipe_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course: Database["public"]["Enums"]["course"]
          created_at?: string
          date: string
          recipe_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course?: Database["public"]["Enums"]["course"]
          created_at?: string
          date?: string
          recipe_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_groups: {
        Row: {
          created_at: string
          default_supplier_id: string | null
          id: string
          name: string
          sort: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_supplier_id?: string | null
          id?: string
          name: string
          sort?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_supplier_id?: string | null
          id?: string
          name?: string
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_groups_default_supplier_id_fkey"
            columns: ["default_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          id: string
          roles: Database["public"]["Enums"]["app_role"][]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          id: string
          roles?: Database["public"]["Enums"]["app_role"][]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          id?: string
          roles?: Database["public"]["Enums"]["app_role"][]
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          ingredient_id: string
          note: string | null
          recipe_id: string
          sort: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          ingredient_id: string
          note?: string | null
          recipe_id: string
          sort?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          ingredient_id?: string
          note?: string | null
          recipe_id?: string
          sort?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          archived: boolean
          author: string | null
          base_adults: number
          base_children: number
          category: string | null
          course: Database["public"]["Enums"]["course"]
          created_at: string
          description: string | null
          id: string
          legacy_allergens: string[] | null
          name: string
          notes: string | null
          steps: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived?: boolean
          author?: string | null
          base_adults?: number
          base_children?: number
          category?: string | null
          course: Database["public"]["Enums"]["course"]
          created_at?: string
          description?: string | null
          id?: string
          legacy_allergens?: string[] | null
          name: string
          notes?: string | null
          steps?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived?: boolean
          author?: string | null
          base_adults?: number
          base_children?: number
          category?: string | null
          course?: Database["public"]["Enums"]["course"]
          created_at?: string
          description?: string | null
          id?: string
          legacy_allergens?: string[] | null
          name?: string
          notes?: string | null
          steps?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      rotation_entries: {
        Row: {
          created_at: string
          position: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          position: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          position?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotation_entries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "week_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          adult_factor: number
          created_at: string
          default_adults: number
          default_children: number
          id: number
          public_default_adults: number
          public_default_children: number
          public_enabled: boolean
          public_show_author: boolean
          public_token: string | null
          rotation_start: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adult_factor?: number
          created_at?: string
          default_adults?: number
          default_children?: number
          id?: number
          public_default_adults?: number
          public_default_children?: number
          public_enabled?: boolean
          public_show_author?: boolean
          public_token?: string | null
          rotation_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adult_factor?: number
          created_at?: string
          default_adults?: number
          default_children?: number
          id?: number
          public_default_adults?: number
          public_default_children?: number
          public_enabled?: boolean
          public_show_author?: boolean
          public_token?: string | null
          rotation_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shopping_checks: {
        Row: {
          amount_at_check: number | null
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          item_key: string
          list_id: string
          updated_at: string
        }
        Insert: {
          amount_at_check?: number | null
          checked: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          item_key: string
          list_id: string
          updated_at?: string
        }
        Update: {
          amount_at_check?: number | null
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          item_key?: string
          list_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_checks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_extras: {
        Row: {
          created_at: string
          created_by: string | null
          done: boolean
          id: string
          list_id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          done?: boolean
          id?: string
          list_id: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          done?: boolean
          id?: string
          list_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_extras_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          days: number
          id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days: number
          id?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: number
          id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          sort: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          sort?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          sort?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      week_template_meals: {
        Row: {
          course: Database["public"]["Enums"]["course"]
          created_at: string
          recipe_id: string
          template_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          course: Database["public"]["Enums"]["course"]
          created_at?: string
          recipe_id: string
          template_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          course?: Database["public"]["Enums"]["course"]
          created_at?: string
          recipe_id?: string
          template_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "week_template_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_template_meals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "week_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      week_templates: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allergens_valid: { Args: { keys: string[] }; Returns: boolean }
      has_role: {
        Args: { r: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_active_user: { Args: never; Returns: boolean }
      merge_ingredients: {
        Args: { source_id: string; target_id: string }
        Returns: number
      }
      save_recipe: {
        Args: { p_id: string; p_lines: Json; p_recipe: Json }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "planung" | "kueche" | "einkauf"
      course: "vorspeise" | "hauptgang" | "nachtisch"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "planung", "kueche", "einkauf"],
      course: ["vorspeise", "hauptgang", "nachtisch"],
    },
  },
} as const
