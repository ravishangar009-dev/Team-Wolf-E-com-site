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
      advertisements: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          image_url: string
          link_url: string | null
          position: number | null
          store_id: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url: string
          link_url?: string | null
          position?: number | null
          store_id?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string
          link_url?: string | null
          position?: number | null
          store_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_offers: {
        Row: {
          id: string
          title: string
          description: string | null
          discount_percentage: number | null
          image_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          discount_percentage?: number | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          discount_percentage?: number | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          id: string
          name: string
          video_url: string | null
          targeted_muscles: string[] | null
          workout_type: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          video_url?: string | null
          targeted_muscles?: string[] | null
          workout_type: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          video_url?: string | null
          targeted_muscles?: string[] | null
          workout_type?: string
          description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      workout_packages: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_workout_access: {
        Row: {
          id: string
          user_id: string
          package_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          package_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          package_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workout_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_access_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "workout_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      user_workout_profiles: {
        Row: {
          id: string
          user_id: string
          fitness_goal: string
          experience_level: string | null
          assessment_completed: boolean | null
          answers: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          fitness_goal: string
          experience_level?: string | null
          assessment_completed?: boolean | null
          answers?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          fitness_goal?: string
          experience_level?: string | null
          assessment_completed?: boolean | null
          answers?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workout_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_agents: {
        Row: {
          active: boolean | null
          agent_name: string
          created_at: string | null
          id: string
          phone: string | null
          user_id: string
          vehicle_number: string | null
        }
        Insert: {
          active?: boolean | null
          agent_name: string
          created_at?: string | null
          id?: string
          phone?: string | null
          user_id: string
          vehicle_number?: string | null
        }
        Update: {
          active?: boolean | null
          agent_name?: string
          created_at?: string | null
          id?: string
          phone?: string | null
          user_id?: string
          vehicle_number?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price_at_time: number
          product_id: string
          quantity: number
          selected_flavor?: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price_at_time: number
          product_id: string
          quantity: number
          selected_flavor?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price_at_time?: number
          product_id?: string
          quantity?: number
          selected_flavor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          created_at: string | null
          customer_name: string
          delivery_agent_id: string | null
          id: string
          phone: string
          status: string | null
          store_id: string
          total_amount: number
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          customer_name: string
          delivery_agent_id?: string | null
          id?: string
          phone: string
          status?: string | null
          store_id: string
          total_amount: number
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          customer_name?: string
          delivery_agent_id?: string | null
          id?: string
          phone?: string
          status?: string | null
          store_id?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_agent_id_fkey"
            columns: ["delivery_agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          product_id: string | null
          product_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          product_id?: string | null
          product_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          product_id?: string | null
          product_name?: string
          user_id?: string
        }
        Relationships: []
      }
      produit_requests: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          product_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          product_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          product_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          offer_active: boolean | null
          offer_percentage: number | null
          offer_price: number | null
          price: number
          stock_count?: number | null
          alert_count?: number | null
          flavors?: string[] | null
          store_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          offer_active?: boolean | null
          offer_percentage?: number | null
          offer_price?: number | null
          price: number
          stock_count?: number | null
          alert_count?: number | null
          flavors?: string[] | null
          store_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          offer_active?: boolean | null
          offer_percentage?: number | null
          offer_price?: number | null
          price?: number
          stock_count?: number | null
          alert_count?: number | null
          flavors?: string[] | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      store_admins: {
        Row: {
          created_at: string | null
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_admins_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          phone: string | null
          upi_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          phone?: string | null
          upi_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          phone?: string | null
          upi_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          is_site_active: boolean
          reopen_at: string | null
          shutdown_message: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_site_active?: boolean
          reopen_at?: string | null
          shutdown_message?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_site_active?: boolean
          reopen_at?: string | null
          shutdown_message?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      vip_customers: {
        Row: {
          id: string
          user_id: string
          global_discount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          global_discount?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          global_discount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vip_product_discounts: {
        Row: {
          id: string
          vip_id: string
          product_id: string
          discount_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          vip_id: string
          product_id: string
          discount_percentage: number
          created_at?: string
        }
        Update: {
          id?: string
          vip_id?: string
          product_id?: string
          discount_percentage?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_product_discounts_vip_id_fkey"
            columns: ["vip_id"]
            isOneToOne: false
            referencedRelation: "vip_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_product_discounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
