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
      bill_items: {
        Row: {
          bill_id: number
          id: number
          inventory_item_id: number
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          bill_id: number
          id?: number
          inventory_item_id: number
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          bill_id?: number
          id?: number
          inventory_item_id?: number
          quantity?: number
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
          unit_cost: number
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
          unit_cost: number
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
          unit_cost?: number
          unit_size?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          id: number
          name: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          phone_number: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          phone_number?: string
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
        }
        Insert: {
          date?: string
          doctor_name: string
          id?: number
          patient_id: number
          prescription_number: string
          status?: string
        }
        Update: {
          date?: string
          doctor_name?: string
          id?: number
          patient_id?: number
          prescription_number?: string
          status?: string
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
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          gstin: string | null
          id: string
          owner_name: string
          pharmacy_name: string
          pincode: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          gstin?: string | null
          id: string
          owner_name: string
          pharmacy_name: string
          pincode?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          gstin?: string | null
          id?: string
          owner_name?: string
          pharmacy_name?: string
          pincode?: string | null
          state?: string | null
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
