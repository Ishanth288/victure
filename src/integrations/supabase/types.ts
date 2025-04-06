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
      announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      bill_items: {
        Row: {
          bill_id: number
          id: number
          inventory_item_id: number
          quantity: number
          return_quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          bill_id: number
          id?: number
          inventory_item_id: number
          quantity: number
          return_quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          bill_id?: number
          id?: number
          inventory_item_id?: number
          quantity?: number
          return_quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_number: string
          date: string
          discount_amount: number | null
          gst_amount: number
          gst_percentage: number
          id: number
          prescription_id: number | null
          status: string
          subtotal: number
          total_amount: number
          user_id: string | null
        }
        Insert: {
          bill_number: string
          date?: string
          discount_amount?: number | null
          gst_amount: number
          gst_percentage: number
          id?: number
          prescription_id?: number | null
          status?: string
          subtotal: number
          total_amount: number
          user_id?: string | null
        }
        Update: {
          bill_number?: string
          date?: string
          discount_amount?: number | null
          gst_amount?: number
          gst_percentage?: number
          id?: number
          prescription_id?: number | null
          status?: string
          subtotal?: number
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_read: boolean | null
          message: string
          user_response: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          user_response?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          user_response?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          dosage_form: string | null
          expiry_date: string | null
          generic_name: string | null
          id: number
          manufacturer: string | null
          name: string
          ndc: string | null
          quantity: number
          reorder_point: number | null
          selling_price: number | null
          status: string
          storage_condition: string | null
          strength: string | null
          supplier: string | null
          unit_cost: number | null
          unit_size: string | null
          user_id: string | null
        }
        Insert: {
          dosage_form?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          id?: number
          manufacturer?: string | null
          name: string
          ndc?: string | null
          quantity?: number
          reorder_point?: number | null
          selling_price?: number | null
          status?: string
          storage_condition?: string | null
          strength?: string | null
          supplier?: string | null
          unit_cost?: number | null
          unit_size?: string | null
          user_id?: string | null
        }
        Update: {
          dosage_form?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          id?: number
          manufacturer?: string | null
          name?: string
          ndc?: string | null
          quantity?: number
          reorder_point?: number | null
          selling_price?: number | null
          status?: string
          storage_condition?: string | null
          strength?: string | null
          supplier?: string | null
          unit_cost?: number | null
          unit_size?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      medicine_returns: {
        Row: {
          bill_item_id: number
          id: number
          processed_by: string
          quantity: number
          reason: string | null
          return_date: string
          status: string
          user_id: string
        }
        Insert: {
          bill_item_id: number
          id?: number
          processed_by: string
          quantity: number
          reason?: string | null
          return_date?: string
          status: string
          user_id: string
        }
        Update: {
          bill_item_id?: number
          id?: number
          processed_by?: string
          quantity?: number
          reason?: string | null
          return_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_returns_bill_item_id_fkey"
            columns: ["bill_item_id"]
            isOneToOne: false
            referencedRelation: "bill_items"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          id: number
          name: string
          phone_number: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          phone_number: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          phone_number?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pharmacy_knowledge: {
        Row: {
          answer: string
          created_at: string | null
          id: number
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: number
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: number
          question?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          date: string
          doctor_name: string
          id: number
          patient_id: number
          prescription_number: string
          status: string
          user_id: string
        }
        Insert: {
          date?: string
          doctor_name: string
          id?: number
          patient_id: number
          prescription_number: string
          status?: string
          user_id: string
        }
        Update: {
          date?: string
          doctor_name?: string
          id?: number
          patient_id?: number
          prescription_number?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: number
          inventory_item_id: number
          new_cost: number
          new_selling_price: number | null
          previous_cost: number
          previous_selling_price: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          inventory_item_id: number
          new_cost: number
          new_selling_price?: number | null
          previous_cost: number
          previous_selling_price?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          inventory_item_id?: number
          new_cost?: number
          new_selling_price?: number | null
          previous_cost?: number
          previous_selling_price?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_item"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          category: string | null
          description: string
          display_order: number | null
          features: Json
          id: string
          is_popular: boolean | null
          name: string
          plan_id: string | null
          price_monthly: number
          price_yearly: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          description: string
          display_order?: number | null
          features: Json
          id?: string
          is_popular?: boolean | null
          name: string
          plan_id?: string | null
          price_monthly: number
          price_yearly: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string
          display_order?: number | null
          features?: Json
          id?: string
          is_popular?: boolean | null
          name?: string
          plan_id?: string | null
          price_monthly?: number
          price_yearly?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          daily_bills_count: number
          gstin: string | null
          id: string
          last_bill_date: string | null
          monthly_bills_count: number
          owner_name: string
          pharmacy_name: string
          phone: string | null
          pincode: string | null
          plan_type: string
          registration_date: string
          role: string | null
          state: string | null
          trial_expiration_date: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          daily_bills_count?: number
          gstin?: string | null
          id: string
          last_bill_date?: string | null
          monthly_bills_count?: number
          owner_name: string
          pharmacy_name: string
          phone?: string | null
          pincode?: string | null
          plan_type?: string
          registration_date?: string
          role?: string | null
          state?: string | null
          trial_expiration_date?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          daily_bills_count?: number
          gstin?: string | null
          id?: string
          last_bill_date?: string | null
          monthly_bills_count?: number
          owner_name?: string
          pharmacy_name?: string
          phone?: string | null
          pincode?: string | null
          plan_type?: string
          registration_date?: string
          role?: string | null
          state?: string | null
          trial_expiration_date?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          delivery_notes: string | null
          id: number
          is_delivered: boolean | null
          item_name: string
          purchase_order_id: number | null
          quantity_delivered: number | null
          quantity_ordered: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          delivery_notes?: string | null
          id?: number
          is_delivered?: boolean | null
          item_name: string
          purchase_order_id?: number | null
          quantity_delivered?: number | null
          quantity_ordered: number
          total_cost: number
          unit_cost: number
        }
        Update: {
          delivery_notes?: string | null
          id?: number
          is_delivered?: boolean | null
          item_name?: string
          purchase_order_id?: number | null
          quantity_delivered?: number | null
          quantity_ordered?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          delivery_notes: string | null
          id: number
          notes: string | null
          order_date: string | null
          status: string | null
          supplier_name: string
          supplier_phone: string | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_notes?: string | null
          id?: number
          notes?: string | null
          order_date?: string | null
          status?: string | null
          supplier_name: string
          supplier_phone?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_notes?: string | null
          id?: number
          notes?: string | null
          order_date?: string | null
          status?: string | null
          supplier_name?: string
          supplier_phone?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          allowed_ips: string | null
          created_at: string | null
          enable_two_factor: boolean | null
          id: number
          ip_restriction: boolean | null
          maintenance_announced_at: string | null
          maintenance_announcement: string | null
          maintenance_end_date: string | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          maintenance_start_date: string | null
          max_login_attempts: number | null
          session_timeout: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_ips?: string | null
          created_at?: string | null
          enable_two_factor?: boolean | null
          id?: number
          ip_restriction?: boolean | null
          maintenance_announced_at?: string | null
          maintenance_announcement?: string | null
          maintenance_end_date?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          maintenance_start_date?: string | null
          max_login_attempts?: number | null
          session_timeout?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_ips?: string | null
          created_at?: string | null
          enable_two_factor?: boolean | null
          id?: number
          ip_restriction?: boolean | null
          maintenance_announced_at?: string | null
          maintenance_announcement?: string | null
          maintenance_end_date?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          maintenance_start_date?: string | null
          max_login_attempts?: number | null
          session_timeout?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      return_analytics: {
        Row: {
          bill_id: number | null
          bill_item_id: number | null
          id: number | null
          inventory_item_id: number | null
          medicine_name: string | null
          original_quantity: number | null
          reason: string | null
          return_date: string | null
          return_value: number | null
          returned_quantity: number | null
          status: string | null
          unit_price: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_returns_bill_item_id_fkey"
            columns: ["bill_item_id"]
            isOneToOne: false
            referencedRelation: "bill_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      reset_monthly_bills_count: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
