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
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      bill_items: {
        Row: {
          bill_id: number
          id: number
          inventory_item_id: number
          is_replacement: boolean | null
          quantity: number
          replacement_item_id: number | null
          replacement_quantity: number | null
          replacement_reason: string | null
          replaced_item_id: number | null
          return_quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          bill_id: number
          id?: number
          inventory_item_id: number
          is_replacement?: boolean | null
          quantity: number
          replacement_item_id?: number | null
          replacement_quantity?: number | null
          replacement_reason?: string | null
          replaced_item_id?: number | null
          return_quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          bill_id?: number
          id?: number
          inventory_item_id?: number
          is_replacement?: boolean | null
          quantity?: number
          replacement_item_id?: number | null
          replacement_quantity?: number | null
          replacement_reason?: string | null
          replaced_item_id?: number | null
          return_quantity?: number | null
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
          {
            foreignKeyName: "bill_items_replaced_item_id_fkey"
            columns: ["replaced_item_id"]
            isOneToOne: false
            referencedRelation: "bill_items"
            referencedColumns: ["id"]
          }
        ]
      }
      bills: {
        Row: {
          created_at: string | null
          id: number
          prescription_id: number
          subtotal: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          prescription_id: number
          subtotal: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          prescription_id?: number
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      deletion_history: {
        Row: {
          id: number
          entity_type: string
          entity_id: number
          entity_data: Json
          deletion_reason: string | null
          deletion_type: string
          patient_id: number | null
          prescription_id: number | null
          bill_id: number | null
          medicine_name: string | null
          deleted_by: string
          deleted_at: string
          amount_affected: number | null
          quantity_affected: number | null
          notes: string | null
          is_reversible: boolean
          reversal_deadline: string | null
        }
        Insert: {
          id?: number
          entity_type: string
          entity_id: number
          entity_data: Json
          deletion_reason?: string | null
          deletion_type?: string
          patient_id?: number | null
          prescription_id?: number | null
          bill_id?: number | null
          medicine_name?: string | null
          deleted_by: string
          deleted_at?: string
          amount_affected?: number | null
          quantity_affected?: number | null
          notes?: string | null
          is_reversible?: boolean
          reversal_deadline?: string | null
        }
        Update: {
          id?: number
          entity_type?: string
          entity_id?: number
          entity_data?: Json
          deletion_reason?: string | null
          deletion_type?: string
          patient_id?: number | null
          prescription_id?: number | null
          bill_id?: number | null
          medicine_name?: string | null
          deleted_by?: string
          deleted_at?: string
          amount_affected?: number | null
          quantity_affected?: number | null
          notes?: string | null
          is_reversible?: boolean
          reversal_deadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deletion_history_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory: {
        Row: {
          batch_number: string | null
          created_at: string | null
          expiry_date: string | null
          id: number
          manufacturer: string | null
          medicine_name: string
          price: number
          quantity_in_stock: number
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: number
          manufacturer?: string | null
          medicine_name: string
          price: number
          quantity_in_stock: number
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: number
          manufacturer?: string | null
          medicine_name?: string
          price?: number
          quantity_in_stock?: number
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      medicine_returns: {
        Row: {
          bill_item_id: number
          created_at: string | null
          id: number
          quantity_returned: number
          reason: string | null
          refund_amount: number
        }
        Insert: {
          bill_item_id: number
          created_at?: string | null
          id?: number
          quantity_returned: number
          reason?: string | null
          refund_amount: number
        }
        Update: {
          bill_item_id?: number
          created_at?: string | null
          id?: number
          quantity_returned?: number
          reason?: string | null
          refund_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicine_returns_bill_item_id_fkey"
            columns: ["bill_item_id"]
            isOneToOne: false
            referencedRelation: "bill_items"
            referencedColumns: ["id"]
          }
        ]
      }
      patients: {
        Row: {
          created_at: string | null
          id: number
          name: string
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_name: string | null
          id: number
          patient_id: number
          prescription_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          doctor_name?: string | null
          id?: number
          patient_id: number
          prescription_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          doctor_name?: string | null
          id?: number
          patient_id?: number
          prescription_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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