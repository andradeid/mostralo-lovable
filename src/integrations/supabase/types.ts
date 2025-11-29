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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      addon_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_selections: number | null
          min_selections: number | null
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      addons: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_available: boolean | null
          name: string
          price: number
          store_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          price?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_achievements: {
        Row: {
          achievement_description: string
          achievement_name: string
          achievement_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          unlocked_at: string
        }
        Insert: {
          achievement_description: string
          achievement_name: string
          achievement_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
        }
        Update: {
          achievement_description?: string
          achievement_name?: string
          achievement_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_goals: {
        Row: {
          admin_id: string
          created_at: string
          goal_type: string
          id: string
          is_active: boolean
          started_at: string
          target_mrr: number
          target_stores_per_month: number
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          goal_type: string
          id?: string
          is_active?: boolean
          started_at?: string
          target_mrr: number
          target_stores_per_month: number
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          goal_type?: string
          id?: string
          is_active?: boolean
          started_at?: string
          target_mrr?: number
          target_stores_per_month?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_goals_progress: {
        Row: {
          admin_id: string
          created_at: string
          current_mrr: number
          date: string
          goal_id: string
          id: string
          is_goal_met: boolean
          new_stores_count: number
          progress_percentage: number
          target_mrr: number
        }
        Insert: {
          admin_id: string
          created_at?: string
          current_mrr?: number
          date: string
          goal_id: string
          id?: string
          is_goal_met?: boolean
          new_stores_count?: number
          progress_percentage?: number
          target_mrr?: number
        }
        Update: {
          admin_id?: string
          created_at?: string
          current_mrr?: number
          date?: string
          goal_id?: string
          id?: string
          is_goal_met?: boolean
          new_stores_count?: number
          progress_percentage?: number
          target_mrr?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_goals_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "admin_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          desktop_image_url: string | null
          display_order: number
          id: string
          is_active: boolean
          link_url: string | null
          mobile_image_url: string | null
          store_id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          desktop_image_url?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          mobile_image_url?: string | null
          store_id: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          desktop_image_url?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          mobile_image_url?: string | null
          store_id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_verses: {
        Row: {
          book: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          reference: string
          verse_text: string
        }
        Insert: {
          book: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          reference: string
          verse_text: string
        }
        Update: {
          book?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reference?: string
          verse_text?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          discount_amount: number
          final_price: number
          id: string
          ip_address: unknown
          original_price: number
          store_id: string | null
          used_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          final_price: number
          id?: string
          ip_address?: unknown
          original_price: number
          store_id?: string | null
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          final_price?: number
          id?: string
          ip_address?: unknown
          original_price?: number
          store_id?: string | null
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          customer_id: string | null
          discount_applied: number
          final_price: number
          id: string
          ip_address: string | null
          original_price: number
          used_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          customer_id?: string | null
          discount_applied: number
          final_price: number
          id?: string
          ip_address?: string | null
          original_price: number
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          customer_id?: string | null
          discount_applied?: number
          final_price?: number
          id?: string
          ip_address?: string | null
          original_price?: number
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_public: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          name: string
          plan_ids: string[] | null
          promotion_label: string | null
          show_countdown: boolean | null
          start_date: string | null
          status: string
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          applies_to: string
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          name: string
          plan_ids?: string[] | null
          promotion_label?: string | null
          show_countdown?: boolean | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          name?: string
          plan_ids?: string[] | null
          promotion_label?: string | null
          show_countdown?: boolean | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      custom_menus: {
        Row: {
          created_at: string
          id: string
          iframe_url: string
          is_active: boolean
          sort_order: number
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          iframe_url: string
          is_active?: boolean
          sort_order?: number
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          iframe_url?: string
          is_active?: boolean
          sort_order?: number
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_menus_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_menus_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_stores: {
        Row: {
          created_at: string | null
          customer_id: string
          first_order_at: string | null
          id: string
          last_order_at: string | null
          store_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          store_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          store_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_stores_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          auth_user_id: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          last_order_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_order_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_order_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_task_completions: {
        Row: {
          admin_id: string
          completed_at: string | null
          completed_quantity: number
          created_at: string
          date: string
          id: string
          notes: string | null
          task_id: string
        }
        Insert: {
          admin_id: string
          completed_at?: string | null
          completed_quantity?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          task_id: string
        }
        Update: {
          admin_id?: string
          completed_at?: string | null
          completed_quantity?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          admin_id: string
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          target_quantity: number
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          category: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          target_quantity?: number
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          target_quantity?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string
          cancelled_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_driver_id: string
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_driver_id: string
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_driver_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_delivery_driver_id_fkey"
            columns: ["delivery_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_delivery_driver_id_fkey"
            columns: ["delivery_driver_id"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_public: boolean | null
          status: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_public?: boolean | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from: string
          valid_until: string
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_public?: boolean | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      driver_earnings: {
        Row: {
          commission_percentage: number | null
          created_at: string | null
          delivered_at: string
          delivery_assignment_id: string | null
          delivery_fee: number
          driver_id: string
          earnings_amount: number
          id: string
          order_id: string
          paid_at: string | null
          payment_receipt_url: string | null
          payment_reference: string | null
          payment_request_count: number | null
          payment_requested_at: string | null
          payment_status: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          store_id: string
          updated_at: string | null
        }
        Insert: {
          commission_percentage?: number | null
          created_at?: string | null
          delivered_at: string
          delivery_assignment_id?: string | null
          delivery_fee: number
          driver_id: string
          earnings_amount: number
          id?: string
          order_id: string
          paid_at?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          payment_request_count?: number | null
          payment_requested_at?: string | null
          payment_status?: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          store_id: string
          updated_at?: string | null
        }
        Update: {
          commission_percentage?: number | null
          created_at?: string | null
          delivered_at?: string
          delivery_assignment_id?: string | null
          delivery_fee?: number
          driver_id?: string
          earnings_amount?: number
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          payment_request_count?: number | null
          payment_requested_at?: string | null
          payment_status?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_delivery_assignment_id_fkey"
            columns: ["delivery_assignment_id"]
            isOneToOne: false
            referencedRelation: "delivery_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_earnings_config: {
        Row: {
          commission_percentage: number | null
          created_at: string | null
          driver_id: string
          fixed_amount: number | null
          id: string
          is_active: boolean | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          store_id: string
          updated_at: string | null
        }
        Insert: {
          commission_percentage?: number | null
          created_at?: string | null
          driver_id: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          store_id: string
          updated_at?: string | null
        }
        Update: {
          commission_percentage?: number | null
          created_at?: string | null
          driver_id?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_invitations: {
        Row: {
          counter_offer_at: string | null
          counter_offer_commission_percentage: number | null
          counter_offer_fixed_amount: number | null
          counter_offer_message: string | null
          counter_offer_payment_type:
            | Database["public"]["Enums"]["payment_type"]
            | null
          created_at: string | null
          driver_id: string
          expires_at: string
          id: string
          invitation_message: string | null
          proposed_commission_percentage: number | null
          proposed_fixed_amount: number | null
          proposed_payment_type:
            | Database["public"]["Enums"]["payment_type"]
            | null
          status: string
          store_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          counter_offer_at?: string | null
          counter_offer_commission_percentage?: number | null
          counter_offer_fixed_amount?: number | null
          counter_offer_message?: string | null
          counter_offer_payment_type?:
            | Database["public"]["Enums"]["payment_type"]
            | null
          created_at?: string | null
          driver_id: string
          expires_at: string
          id?: string
          invitation_message?: string | null
          proposed_commission_percentage?: number | null
          proposed_fixed_amount?: number | null
          proposed_payment_type?:
            | Database["public"]["Enums"]["payment_type"]
            | null
          status?: string
          store_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          counter_offer_at?: string | null
          counter_offer_commission_percentage?: number | null
          counter_offer_fixed_amount?: number | null
          counter_offer_message?: string | null
          counter_offer_payment_type?:
            | Database["public"]["Enums"]["payment_type"]
            | null
          created_at?: string | null
          driver_id?: string
          expires_at?: string
          id?: string
          invitation_message?: string | null
          proposed_commission_percentage?: number | null
          proposed_fixed_amount?: number | null
          proposed_payment_type?:
            | Database["public"]["Enums"]["payment_type"]
            | null
          status?: string
          store_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_invitations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_invitations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_invitations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_invitations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_notifications: {
        Row: {
          created_at: string | null
          driver_id: string
          id: string
          message: string
          read_at: string | null
          store_name: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: string
          message: string
          read_at?: string | null
          store_name?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: string
          message?: string
          read_at?: string | null
          store_name?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_notifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_notifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payment_info: {
        Row: {
          account_holder_name: string
          created_at: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          pix_key: string
          pix_key_type: string
          updated_at: string | null
        }
        Insert: {
          account_holder_name: string
          created_at?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          pix_key: string
          pix_key_type: string
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string
          created_at?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          pix_key?: string
          pix_key_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      order_addons: {
        Row: {
          addon_id: string | null
          addon_name: string
          created_at: string
          id: string
          order_item_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          addon_id?: string | null
          addon_name: string
          created_at?: string
          id?: string
          order_item_id: string
          quantity?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          addon_id?: string | null
          addon_name?: string
          created_at?: string
          id?: string
          order_item_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_addons_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
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
          assigned_driver_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          id: string
          is_outside_delivery_zone: boolean | null
          notes: string | null
          order_number: string
          payment_details: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          promotion_code: string | null
          promotion_discount: number | null
          promotion_id: string | null
          requires_zone_approval: boolean | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          assigned_driver_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          id?: string
          is_outside_delivery_zone?: boolean | null
          notes?: string | null
          order_number: string
          payment_details?: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promotion_code?: string | null
          promotion_discount?: number | null
          promotion_id?: string | null
          requires_zone_approval?: boolean | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          assigned_driver_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          id?: string
          is_outside_delivery_zone?: boolean | null
          notes?: string | null
          order_number?: string
          payment_details?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promotion_code?: string | null
          promotion_discount?: number | null
          promotion_id?: string | null
          requires_zone_approval?: boolean | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
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
      payment_approvals: {
        Row: {
          address: Json | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          company_document: string | null
          company_name: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          payment_amount: number
          payment_method: string
          payment_proof_url: string | null
          phone: string | null
          pix_key: string | null
          plan_id: string | null
          referred_by_salesperson_id: string | null
          rejection_reason: string | null
          status: string
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_document?: string | null
          company_name?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_amount: number
          payment_method?: string
          payment_proof_url?: string | null
          phone?: string | null
          pix_key?: string | null
          plan_id?: string | null
          referred_by_salesperson_id?: string | null
          rejection_reason?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_document?: string | null
          company_name?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_method?: string
          payment_proof_url?: string | null
          phone?: string | null
          pix_key?: string | null
          plan_id?: string | null
          referred_by_salesperson_id?: string | null
          rejection_reason?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_approvals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_approvals_referred_by_salesperson_id_fkey"
            columns: ["referred_by_salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_approvals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_approvals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          created_at: string
          driver_id: string
          earning_ids: string[]
          id: string
          notes: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          store_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          earning_ids: string[]
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          earning_ids?: string[]
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_modules: {
        Row: {
          id: string
          module_id: string | null
          plan_id: string | null
        }
        Insert: {
          id?: string
          module_id?: string | null
          plan_id?: string | null
        }
        Update: {
          id?: string
          module_id?: string | null
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_modules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle_type"]
          created_at: string
          description: string | null
          discount_percentage: number | null
          discount_price: number | null
          features: Json | null
          id: string
          is_popular: boolean | null
          max_categories: number | null
          max_products: number | null
          name: string
          price: number
          promotion_active: boolean | null
          promotion_end_date: string | null
          promotion_label: string | null
          promotion_start_date: string | null
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_type"]
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          discount_price?: number | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          max_categories?: number | null
          max_products?: number | null
          name: string
          price: number
          promotion_active?: boolean | null
          promotion_end_date?: string | null
          promotion_label?: string | null
          promotion_start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_type"]
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          discount_price?: number | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          max_categories?: number | null
          max_products?: number | null
          name?: string
          price?: number
          promotion_active?: boolean | null
          promotion_end_date?: string | null
          promotion_label?: string | null
          promotion_start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: []
      }
      print_configurations: {
        Row: {
          auto_print_on_accept: boolean | null
          created_at: string
          custom_texts: Json
          cut_method: string | null
          document_type: string
          id: string
          is_active: boolean | null
          print_copies: Json | null
          print_type: string
          qz_tray_printer: string | null
          sections: Json
          store_id: string
          styles: Json
          updated_at: string
        }
        Insert: {
          auto_print_on_accept?: boolean | null
          created_at?: string
          custom_texts?: Json
          cut_method?: string | null
          document_type: string
          id?: string
          is_active?: boolean | null
          print_copies?: Json | null
          print_type: string
          qz_tray_printer?: string | null
          sections?: Json
          store_id: string
          styles?: Json
          updated_at?: string
        }
        Update: {
          auto_print_on_accept?: boolean | null
          created_at?: string
          custom_texts?: Json
          cut_method?: string | null
          document_type?: string
          id?: string
          is_active?: boolean | null
          print_copies?: Json | null
          print_type?: string
          qz_tray_printer?: string | null
          sections?: Json
          store_id?: string
          styles?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_addons: {
        Row: {
          addon_id: string
          created_at: string
          id: string
          is_required: boolean | null
          max_quantity: number | null
          product_id: string
        }
        Insert: {
          addon_id: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          max_quantity?: number | null
          product_id: string
        }
        Update: {
          addon_id?: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          max_quantity?: number | null
          product_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_available: boolean
          is_default: boolean
          name: string
          price: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          is_default?: boolean
          name: string
          price?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          is_default?: boolean
          name?: string
          price?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          button_text: string | null
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_gallery: string[] | null
          image_url: string | null
          is_available: boolean | null
          is_on_offer: boolean | null
          name: string
          offer_price: number | null
          original_price: number | null
          price: number
          slug: string | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_gallery?: string[] | null
          image_url?: string | null
          is_available?: boolean | null
          is_on_offer?: boolean | null
          name: string
          offer_price?: number | null
          original_price?: number | null
          price: number
          slug?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_gallery?: string[] | null
          image_url?: string | null
          is_available?: boolean | null
          is_on_offer?: boolean | null
          name?: string
          offer_price?: number | null
          original_price?: number | null
          price?: number
          slug?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
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
          approval_status: string | null
          avatar_url: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          driver_available_for_invites: boolean | null
          email: string
          full_name: string | null
          id: string
          is_blocked: boolean | null
          is_deleted: boolean | null
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          approval_status?: string | null
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          driver_available_for_invites?: boolean | null
          email: string
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          is_deleted?: boolean | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          approval_status?: string | null
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          driver_available_for_invites?: boolean | null
          email?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          is_deleted?: boolean | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      promotion_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          promotion_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          promotion_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_categories_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_products: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          promotion_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          promotion_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_usage: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount_applied: number
          id: string
          order_id: string
          promotion_code: string | null
          promotion_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount_applied: number
          id?: string
          order_id: string
          promotion_code?: string | null
          promotion_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount_applied?: number
          id?: string
          order_id?: string
          promotion_code?: string | null
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          allowed_days: string[] | null
          applies_to_delivery: boolean | null
          applies_to_pickup: boolean | null
          banner_image_url: string | null
          bogo_buy_quantity: number | null
          bogo_get_quantity: number | null
          code: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          display_order: number | null
          end_date: string | null
          end_time: string | null
          first_order_only: boolean | null
          id: string
          is_visible_on_store: boolean | null
          max_uses: number | null
          max_uses_per_customer: number | null
          minimum_order_value: number | null
          name: string
          popup_frequency_type:
            | Database["public"]["Enums"]["popup_frequency_type"]
            | null
          popup_max_displays: number | null
          scope: Database["public"]["Enums"]["promotion_scope"]
          show_as_popup: boolean | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["promotion_status"]
          store_id: string
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string | null
        }
        Insert: {
          allowed_days?: string[] | null
          applies_to_delivery?: boolean | null
          applies_to_pickup?: boolean | null
          banner_image_url?: string | null
          bogo_buy_quantity?: number | null
          bogo_get_quantity?: number | null
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          display_order?: number | null
          end_date?: string | null
          end_time?: string | null
          first_order_only?: boolean | null
          id?: string
          is_visible_on_store?: boolean | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          minimum_order_value?: number | null
          name: string
          popup_frequency_type?:
            | Database["public"]["Enums"]["popup_frequency_type"]
            | null
          popup_max_displays?: number | null
          scope: Database["public"]["Enums"]["promotion_scope"]
          show_as_popup?: boolean | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          store_id: string
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
        }
        Update: {
          allowed_days?: string[] | null
          applies_to_delivery?: boolean | null
          applies_to_pickup?: boolean | null
          banner_image_url?: string | null
          bogo_buy_quantity?: number | null
          bogo_get_quantity?: number | null
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          display_order?: number | null
          end_date?: string | null
          end_time?: string | null
          first_order_only?: boolean | null
          id?: string
          is_visible_on_store?: boolean | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          minimum_order_value?: number | null
          name?: string
          popup_frequency_type?:
            | Database["public"]["Enums"]["popup_frequency_type"]
            | null
          popup_max_displays?: number | null
          scope?: Database["public"]["Enums"]["promotion_scope"]
          show_as_popup?: boolean | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          store_id?: string
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      salespeople: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cnae_codes: string[]
          cnpj: string
          cnpj_validated: boolean | null
          cnpj_validated_at: string | null
          cnpj_validation_data: Json | null
          company_name: string
          company_trade_name: string | null
          contract_accepted_at: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string
          pix_key: string | null
          pix_key_type: string | null
          referral_code: string
          rejection_reason: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cnae_codes?: string[]
          cnpj: string
          cnpj_validated?: boolean | null
          cnpj_validated_at?: string | null
          cnpj_validation_data?: Json | null
          company_name: string
          company_trade_name?: string | null
          contract_accepted_at?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          pix_key?: string | null
          pix_key_type?: string | null
          referral_code: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cnae_codes?: string[]
          cnpj?: string
          cnpj_validated?: boolean | null
          cnpj_validated_at?: string | null
          cnpj_validation_data?: Json | null
          company_name?: string
          company_trade_name?: string | null
          contract_accepted_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          pix_key?: string | null
          pix_key_type?: string | null
          referral_code?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      salesperson_bonus_achievements: {
        Row: {
          achieved_at: string
          achieved_in_month: number
          bonus_amount: number
          bonus_tier_id: string
          created_at: string | null
          id: string
          payout_id: string | null
          quarter: number
          sales_count: number
          salesperson_id: string
          status: string
          year: number
        }
        Insert: {
          achieved_at?: string
          achieved_in_month: number
          bonus_amount: number
          bonus_tier_id: string
          created_at?: string | null
          id?: string
          payout_id?: string | null
          quarter: number
          sales_count: number
          salesperson_id: string
          status?: string
          year: number
        }
        Update: {
          achieved_at?: string
          achieved_in_month?: number
          bonus_amount?: number
          bonus_tier_id?: string
          created_at?: string | null
          id?: string
          payout_id?: string | null
          quarter?: number
          sales_count?: number
          salesperson_id?: string
          status?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_bonus_achievements_bonus_tier_id_fkey"
            columns: ["bonus_tier_id"]
            isOneToOne: false
            referencedRelation: "salesperson_bonus_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_bonus_achievements_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "salesperson_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_bonus_achievements_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_bonus_tiers: {
        Row: {
          bonus_amount: number
          created_at: string | null
          cycle_type: string
          id: string
          is_active: boolean | null
          is_cumulative: boolean | null
          min_sales: number
          tier_name: string
          tier_order: number
          updated_at: string | null
        }
        Insert: {
          bonus_amount: number
          created_at?: string | null
          cycle_type?: string
          id?: string
          is_active?: boolean | null
          is_cumulative?: boolean | null
          min_sales: number
          tier_name: string
          tier_order: number
          updated_at?: string | null
        }
        Update: {
          bonus_amount?: number
          created_at?: string | null
          cycle_type?: string
          id?: string
          is_active?: boolean | null
          is_cumulative?: boolean | null
          min_sales?: number
          tier_name?: string
          tier_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      salesperson_commission_configs: {
        Row: {
          applies_to: string
          commission_type: string
          commission_value: number
          created_at: string | null
          id: string
          is_active: boolean | null
          max_commission: number | null
          min_plan_value: number | null
          salesperson_id: string
          updated_at: string | null
        }
        Insert: {
          applies_to?: string
          commission_type: string
          commission_value: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_commission?: number | null
          min_plan_value?: number | null
          salesperson_id: string
          updated_at?: string | null
        }
        Update: {
          applies_to?: string
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_commission?: number | null
          min_plan_value?: number | null
          salesperson_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_commission_configs_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_contracts: {
        Row: {
          accepted_at: string
          bonus_terms: Json | null
          cnae_requirements: string[] | null
          commission_terms: Json
          contract_text: string
          created_at: string | null
          id: string
          ip_address: string | null
          salesperson_id: string
          user_agent: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          bonus_terms?: Json | null
          cnae_requirements?: string[] | null
          commission_terms: Json
          contract_text: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          salesperson_id: string
          user_agent?: string | null
          version: string
        }
        Update: {
          accepted_at?: string
          bonus_terms?: Json | null
          cnae_requirements?: string[] | null
          commission_terms?: Json
          contract_text?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          salesperson_id?: string
          user_agent?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_contracts_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_payouts: {
        Row: {
          bonus_total: number
          commission_total: number
          created_at: string | null
          cycle_month: number
          cycle_year: number
          grand_total: number
          id: string
          invoice_number: string | null
          invoice_url: string | null
          notes: string | null
          paid_at: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          pix_key: string | null
          pix_key_type: string | null
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salesperson_id: string
          status: string
          total_sales: number
          updated_at: string | null
        }
        Insert: {
          bonus_total?: number
          commission_total: number
          created_at?: string | null
          cycle_month: number
          cycle_year: number
          grand_total: number
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salesperson_id: string
          status?: string
          total_sales: number
          updated_at?: string | null
        }
        Update: {
          bonus_total?: number
          commission_total?: number
          created_at?: string | null
          cycle_month?: number
          cycle_year?: number
          grand_total?: number
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salesperson_id?: string
          status?: string
          total_sales?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_payouts_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_sales: {
        Row: {
          commission_amount: number
          commission_type: string
          created_at: string | null
          customer_user_id: string
          id: string
          payment_approval_id: string | null
          payment_cycle_month: number
          payment_cycle_year: number
          plan_id: string
          quarter: number
          sale_amount: number
          sale_date: string
          salesperson_id: string
          status: string
          store_id: string
        }
        Insert: {
          commission_amount: number
          commission_type: string
          created_at?: string | null
          customer_user_id: string
          id?: string
          payment_approval_id?: string | null
          payment_cycle_month: number
          payment_cycle_year: number
          plan_id: string
          quarter: number
          sale_amount: number
          sale_date: string
          salesperson_id: string
          status?: string
          store_id: string
        }
        Update: {
          commission_amount?: number
          commission_type?: string
          created_at?: string | null
          customer_user_id?: string
          id?: string
          payment_approval_id?: string | null
          payment_cycle_month?: number
          payment_cycle_year?: number
          plan_id?: string
          quarter?: number
          sale_amount?: number
          sale_date?: string
          salesperson_id?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_sales_payment_approval_id_fkey"
            columns: ["payment_approval_id"]
            isOneToOne: true
            referencedRelation: "payment_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_sales_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_sales_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          allowed_roles: string[] | null
          attempted_route: string
          created_at: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          allowed_roles?: string[] | null
          attempted_route: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          allowed_roles?: string[] | null
          attempted_route?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      store_configurations: {
        Row: {
          accept_outside_delivery_zone: boolean | null
          created_at: string
          delivery_button_text: string | null
          delivery_times: Json | null
          delivery_zones: Json | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          id: string
          mercado_pago_token: string | null
          online_payment_enabled: boolean | null
          pickup_button_text: string | null
          pix_key: string | null
          primary_color: string | null
          product_display_layout: string | null
          qr_code_enabled: boolean | null
          qr_code_url: string | null
          secondary_color: string | null
          social_media: Json | null
          store_id: string
          stripe_config: Json | null
          updated_at: string
        }
        Insert: {
          accept_outside_delivery_zone?: boolean | null
          created_at?: string
          delivery_button_text?: string | null
          delivery_times?: Json | null
          delivery_zones?: Json | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          mercado_pago_token?: string | null
          online_payment_enabled?: boolean | null
          pickup_button_text?: string | null
          pix_key?: string | null
          primary_color?: string | null
          product_display_layout?: string | null
          qr_code_enabled?: boolean | null
          qr_code_url?: string | null
          secondary_color?: string | null
          social_media?: Json | null
          store_id: string
          stripe_config?: Json | null
          updated_at?: string
        }
        Update: {
          accept_outside_delivery_zone?: boolean | null
          created_at?: string
          delivery_button_text?: string | null
          delivery_times?: Json | null
          delivery_zones?: Json | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          mercado_pago_token?: string | null
          online_payment_enabled?: boolean | null
          pickup_button_text?: string | null
          pix_key?: string | null
          primary_color?: string | null
          product_display_layout?: string | null
          qr_code_enabled?: boolean | null
          qr_code_url?: string | null
          secondary_color?: string | null
          social_media?: Json | null
          store_id?: string
          stripe_config?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_invite_links: {
        Row: {
          created_at: string
          created_by: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          store_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          store_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          store_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_invite_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_invite_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accepts_card: boolean | null
          accepts_cash: boolean | null
          accepts_pix: boolean | null
          address: string | null
          analytics_config: Json | null
          business_hours: Json | null
          city: string | null
          cover_url: string | null
          created_at: string
          custom_domain: string | null
          custom_domain_requested_at: string | null
          custom_domain_verified: boolean | null
          custom_monthly_price: number | null
          delivery_config: Json | null
          delivery_fee: number | null
          description: string | null
          discount_applied_at: string | null
          discount_applied_by: string | null
          discount_reason: string | null
          facebook: string | null
          google_maps_link: string | null
          id: string
          instagram: string | null
          last_order_number: number | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          min_order_value: number | null
          name: string
          owner_id: string | null
          payment_gateways: Json | null
          phone: string | null
          plan_id: string | null
          preferred_navigation_app: string | null
          responsible_cpf: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_phone: string | null
          segment: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["store_status"]
          subscription_expires_at: string | null
          theme_colors: Json | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          accepts_card?: boolean | null
          accepts_cash?: boolean | null
          accepts_pix?: boolean | null
          address?: string | null
          analytics_config?: Json | null
          business_hours?: Json | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_requested_at?: string | null
          custom_domain_verified?: boolean | null
          custom_monthly_price?: number | null
          delivery_config?: Json | null
          delivery_fee?: number | null
          description?: string | null
          discount_applied_at?: string | null
          discount_applied_by?: string | null
          discount_reason?: string | null
          facebook?: string | null
          google_maps_link?: string | null
          id?: string
          instagram?: string | null
          last_order_number?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          min_order_value?: number | null
          name: string
          owner_id?: string | null
          payment_gateways?: Json | null
          phone?: string | null
          plan_id?: string | null
          preferred_navigation_app?: string | null
          responsible_cpf?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          segment?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          subscription_expires_at?: string | null
          theme_colors?: Json | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          accepts_card?: boolean | null
          accepts_cash?: boolean | null
          accepts_pix?: boolean | null
          address?: string | null
          analytics_config?: Json | null
          business_hours?: Json | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_requested_at?: string | null
          custom_domain_verified?: boolean | null
          custom_monthly_price?: number | null
          delivery_config?: Json | null
          delivery_fee?: number | null
          description?: string | null
          discount_applied_at?: string | null
          discount_applied_by?: string | null
          discount_reason?: string | null
          facebook?: string | null
          google_maps_link?: string | null
          id?: string
          instagram?: string | null
          last_order_number?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          min_order_value?: number | null
          name?: string
          owner_id?: string | null
          payment_gateways?: Json | null
          phone?: string | null
          plan_id?: string | null
          preferred_navigation_app?: string | null
          responsible_cpf?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          segment?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          subscription_expires_at?: string | null
          theme_colors?: Json | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_discount_applied_by_fkey"
            columns: ["discount_applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_discount_applied_by_fkey"
            columns: ["discount_applied_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          payment_proof_url: string | null
          payment_status: string | null
          pix_key: string | null
          pix_qr_code: string | null
          plan_id: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          pix_key?: string | null
          pix_qr_code?: string | null
          plan_id?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          pix_key?: string | null
          pix_qr_code?: string | null
          plan_id?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payment_config: {
        Row: {
          account_holder_name: string
          account_number: string | null
          agency: string | null
          bank_name: string | null
          created_at: string | null
          enable_auto_approval: boolean | null
          enable_manual_approval: boolean | null
          id: string
          is_active: boolean | null
          payment_instructions: string | null
          pix_key: string
          pix_key_type: string
          updated_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          enable_auto_approval?: boolean | null
          enable_manual_approval?: boolean | null
          id?: string
          is_active?: boolean | null
          payment_instructions?: string | null
          pix_key: string
          pix_key_type: string
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          enable_auto_approval?: boolean | null
          enable_manual_approval?: boolean | null
          id?: string
          is_active?: boolean | null
          payment_instructions?: string | null
          pix_key?: string
          pix_key_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_store_config: {
        Row: {
          accept_outside_delivery_zone: boolean | null
          created_at: string | null
          delivery_button_text: string | null
          delivery_times: Json | null
          delivery_zones: Json | null
          pickup_button_text: string | null
          primary_color: string | null
          product_display_layout: string | null
          qr_code_enabled: boolean | null
          secondary_color: string | null
          store_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      public_stores: {
        Row: {
          address: string | null
          business_hours: Json | null
          city: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          phone: string | null
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["store_status"] | null
          theme_colors: Json | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["store_status"] | null
          theme_colors?: Json | null
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["store_status"] | null
          theme_colors?: Json | null
        }
        Relationships: []
      }
      unified_users_view: {
        Row: {
          avatar_url: string | null
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string | null
          customer_data: Json | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_blocked: boolean | null
          is_deleted: boolean | null
          roles: Json | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_payment: {
        Args: { admin_user_id: string; approval_id: string }
        Returns: boolean
      }
      generate_product_slug: {
        Args: { input_store_id: string; product_name: string }
        Returns: string
      }
      get_current_user_type: {
        Args: never
        Returns: Database["public"]["Enums"]["user_type"]
      }
      get_next_order_number: { Args: { store_uuid: string }; Returns: string }
      get_user_store_ids_direct: {
        Args: { check_user_id: string }
        Returns: {
          store_id: string
        }[]
      }
      has_pending_approval: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_store: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _store_id: string
          _user_id: string
        }
        Returns: boolean
      }
      increment_promotion_usage: {
        Args: { promotion_id_param: string }
        Returns: undefined
      }
      is_attendant_for_customer_store: {
        Args: { customer_store_id: string }
        Returns: boolean
      }
      is_attendant_for_order_store: {
        Args: { order_store_id: string }
        Returns: boolean
      }
      is_attendant_for_store: {
        Args: { store_id_param: string }
        Returns: boolean
      }
      is_attendant_of_driver_store: {
        Args: { driver_user_id: string }
        Returns: boolean
      }
      is_attendant_of_store_direct: {
        Args: { check_store_id: string; check_user_id: string }
        Returns: boolean
      }
      is_customer_self: { Args: { _customer_id: string }; Returns: boolean }
      is_delivery_driver: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      is_driver_of_customer_orders: {
        Args: { driver_user_id: string }
        Returns: boolean
      }
      is_store_admin_of_attendant: {
        Args: { attendant_user_id: string }
        Returns: boolean
      }
      is_store_owner_direct: {
        Args: { check_store_id: string; check_user_id: string }
        Returns: boolean
      }
      is_store_owner_of_customer: {
        Args: { _customer_id: string }
        Returns: boolean
      }
      is_store_owner_of_driver: {
        Args: { driver_user_id: string }
        Returns: boolean
      }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { check_user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: { p_action: string; p_details?: Json; p_target_user_id: string }
        Returns: undefined
      }
      reject_payment: {
        Args: { admin_user_id: string; approval_id: string; reason?: string }
        Returns: boolean
      }
      update_expired_coupons: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "master_admin"
        | "store_admin"
        | "customer"
        | "delivery_driver"
        | "attendant"
        | "salesperson"
      billing_cycle_type: "monthly" | "quarterly" | "biannual" | "annual"
      delivery_type: "delivery" | "pickup"
      order_status:
        | "entrada"
        | "em_preparo"
        | "aguarda_retirada"
        | "em_transito"
        | "concluido"
        | "cancelado"
      payment_method: "pix" | "card" | "cash"
      payment_status: "pending" | "paid" | "cancelled"
      payment_type: "fixed" | "commission"
      plan_status: "active" | "inactive"
      popup_frequency_type: "once_browser" | "once_session" | "custom_count"
      promotion_scope:
        | "all_products"
        | "category"
        | "specific_products"
        | "delivery_type"
      promotion_status: "active" | "scheduled" | "paused" | "expired"
      promotion_type:
        | "percentage"
        | "fixed_amount"
        | "free_delivery"
        | "bogo"
        | "first_order"
        | "minimum_order"
      store_status: "active" | "inactive" | "suspended"
      user_type: "master_admin" | "store_admin"
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
      app_role: [
        "master_admin",
        "store_admin",
        "customer",
        "delivery_driver",
        "attendant",
        "salesperson",
      ],
      billing_cycle_type: ["monthly", "quarterly", "biannual", "annual"],
      delivery_type: ["delivery", "pickup"],
      order_status: [
        "entrada",
        "em_preparo",
        "aguarda_retirada",
        "em_transito",
        "concluido",
        "cancelado",
      ],
      payment_method: ["pix", "card", "cash"],
      payment_status: ["pending", "paid", "cancelled"],
      payment_type: ["fixed", "commission"],
      plan_status: ["active", "inactive"],
      popup_frequency_type: ["once_browser", "once_session", "custom_count"],
      promotion_scope: [
        "all_products",
        "category",
        "specific_products",
        "delivery_type",
      ],
      promotion_status: ["active", "scheduled", "paused", "expired"],
      promotion_type: [
        "percentage",
        "fixed_amount",
        "free_delivery",
        "bogo",
        "first_order",
        "minimum_order",
      ],
      store_status: ["active", "inactive", "suspended"],
      user_type: ["master_admin", "store_admin"],
    },
  },
} as const
