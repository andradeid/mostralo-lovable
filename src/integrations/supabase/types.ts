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
      admin_idea_overrides: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          idea_id: number
          priority: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          idea_id: number
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          idea_id?: number
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_earnings_resets: {
        Row: {
          affiliates_count: number
          created_at: string | null
          executed_by: string | null
          id: string
          notes: string | null
          reset_at: string
          reset_details: Json | null
          total_reset_amount: number
        }
        Insert: {
          affiliates_count?: number
          created_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          reset_at?: string
          reset_details?: Json | null
          total_reset_amount?: number
        }
        Update: {
          affiliates_count?: number
          created_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          reset_at?: string
          reset_details?: Json | null
          total_reset_amount?: number
        }
        Relationships: []
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
          whatsapp_jid: string | null
          whatsapp_valid: boolean | null
          whatsapp_validated_at: string | null
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
          whatsapp_jid?: string | null
          whatsapp_valid?: boolean | null
          whatsapp_validated_at?: string | null
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
          whatsapp_jid?: string | null
          whatsapp_valid?: boolean | null
          whatsapp_validated_at?: string | null
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
          minimum_amount: number | null
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
          minimum_amount?: number | null
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
          minimum_amount?: number | null
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
          minimum_amount: number | null
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
          minimum_amount?: number | null
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
          minimum_amount?: number | null
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
      evolution_config: {
        Row: {
          api_key: string
          api_url: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          openai_api_key: string | null
          openai_creds_id: string | null
          openai_default_model: string | null
          openai_max_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          openai_api_key?: string | null
          openai_creds_id?: string | null
          openai_default_model?: string | null
          openai_max_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          openai_api_key?: string | null
          openai_creds_id?: string | null
          openai_default_model?: string | null
          openai_max_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      external_clients: {
        Row: {
          address: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zipcode: string | null
          created_at: string | null
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          person_type: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          person_type?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          person_type?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      external_invoices: {
        Row: {
          amount: number
          boleto_charge_id: string | null
          boleto_codigo_barras: string | null
          boleto_expires_at: string | null
          boleto_linha_digitavel: string | null
          boleto_pdf_url: string | null
          boleto_view_url: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string
          id: string
          invoice_number: string | null
          is_recurring: boolean | null
          next_due_date: string | null
          notes: string | null
          paid_at: string | null
          parent_invoice_id: string | null
          payment_method: string | null
          payment_status: string | null
          pix_copia_cola: string | null
          pix_expires_at: string | null
          pix_qrcode_base64: string | null
          pix_txid: string | null
          recurrence_count: number | null
          recurrence_current: number | null
          recurrence_type: string | null
          service_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          boleto_charge_id?: string | null
          boleto_codigo_barras?: string | null
          boleto_expires_at?: string | null
          boleto_linha_digitavel?: string | null
          boleto_pdf_url?: string | null
          boleto_view_url?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date: string
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          paid_at?: string | null
          parent_invoice_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
          recurrence_count?: number | null
          recurrence_current?: number | null
          recurrence_type?: string | null
          service_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          boleto_charge_id?: string | null
          boleto_codigo_barras?: string | null
          boleto_expires_at?: string | null
          boleto_linha_digitavel?: string | null
          boleto_pdf_url?: string | null
          boleto_view_url?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          paid_at?: string | null
          parent_invoice_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
          recurrence_count?: number | null
          recurrence_current?: number | null
          recurrence_type?: string | null
          service_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "external_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_invoices_parent_invoice_id_fkey"
            columns: ["parent_invoice_id"]
            isOneToOne: false
            referencedRelation: "external_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_invoices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "external_services"
            referencedColumns: ["id"]
          },
        ]
      }
      external_services: {
        Row: {
          billing_type: string | null
          created_at: string | null
          created_by: string | null
          default_price: number
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          billing_type?: string | null
          created_at?: string | null
          created_by?: string | null
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          billing_type?: string | null
          created_at?: string | null
          created_by?: string | null
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          store_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          store_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          store_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          order_id: string | null
          payment_method: string | null
          recurrence_type: string | null
          reference_number: string | null
          store_id: string
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          recurrence_type?: string | null
          reference_number?: string | null
          store_id: string
          transaction_date?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          recurrence_type?: string | null
          reference_number?: string | null
          store_id?: string
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_events_log: {
        Row: {
          created_at: string
          error_message: string | null
          event_code: string | null
          event_id: string
          event_type: string
          id: string
          order_id: string | null
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_code?: string | null
          event_id: string
          event_type: string
          id?: string
          order_id?: string | null
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_code?: string | null
          event_id?: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ifood_events_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ifood_events_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_integrations: {
        Row: {
          access_token: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          environment: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          merchant_id: string | null
          refresh_token: string | null
          store_id: string
          token_expires_at: string | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          store_id: string
          token_expires_at?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          store_id?: string
          token_expires_at?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ifood_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ifood_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_up_reminders: {
        Row: {
          created_at: string | null
          days_stale: number | null
          dismissed_at: string | null
          id: string
          lead_company: string | null
          lead_id: string
          lead_name: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_stale?: number | null
          dismissed_at?: string | null
          id?: string
          lead_company?: string | null
          lead_id: string
          lead_name?: string | null
          message: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_stale?: number | null
          dismissed_at?: string | null
          id?: string
          lead_company?: string | null
          lead_id?: string
          lead_name?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_up_reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_type: string | null
          city: string
          company_name: string
          company_phone: string | null
          contacted_at: string | null
          converted_at: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          landing_page: string | null
          last_follow_up_reminder_at: string | null
          monthly_revenue: string | null
          name: string
          notes: string | null
          phone: string
          referral_code: string | null
          salesperson_id: string | null
          source: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          uses_ifood: boolean | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          business_type?: string | null
          city: string
          company_name: string
          company_phone?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          last_follow_up_reminder_at?: string | null
          monthly_revenue?: string | null
          name: string
          notes?: string | null
          phone: string
          referral_code?: string | null
          salesperson_id?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          uses_ifood?: boolean | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          business_type?: string | null
          city?: string
          company_name?: string
          company_phone?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          last_follow_up_reminder_at?: string | null
          monthly_revenue?: string | null
          name?: string
          notes?: string | null
          phone?: string
          referral_code?: string | null
          salesperson_id?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          uses_ifood?: boolean | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      master_admin_test_config: {
        Row: {
          admin_user_id: string
          bot_debounce_time: number | null
          bot_delay_message: number | null
          bot_enabled: boolean | null
          bot_evolution_id: string | null
          bot_expire_minutes: number | null
          bot_keep_open: boolean | null
          bot_keyword_finish: string | null
          bot_listening_from_me: boolean | null
          bot_name: string | null
          bot_split_messages: boolean | null
          bot_stop_from_me: boolean | null
          bot_system_prompt: string | null
          bot_time_per_char: number | null
          bot_trigger_type: string | null
          bot_trigger_value: string | null
          bot_unknown_message: string | null
          created_at: string | null
          id: string
          last_test_at: string | null
          openai_api_key: string | null
          sandbox_address: string | null
          sandbox_business_hours: Json | null
          sandbox_categories: Json | null
          sandbox_products: Json | null
          sandbox_store_description: string | null
          sandbox_store_name: string | null
          sandbox_whatsapp: string | null
          test_instance_id: string | null
          test_instance_name: string | null
          test_instance_qr_code: string | null
          test_instance_status: string | null
          test_logs: Json | null
          test_messages_count: number | null
          test_phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          admin_user_id: string
          bot_debounce_time?: number | null
          bot_delay_message?: number | null
          bot_enabled?: boolean | null
          bot_evolution_id?: string | null
          bot_expire_minutes?: number | null
          bot_keep_open?: boolean | null
          bot_keyword_finish?: string | null
          bot_listening_from_me?: boolean | null
          bot_name?: string | null
          bot_split_messages?: boolean | null
          bot_stop_from_me?: boolean | null
          bot_system_prompt?: string | null
          bot_time_per_char?: number | null
          bot_trigger_type?: string | null
          bot_trigger_value?: string | null
          bot_unknown_message?: string | null
          created_at?: string | null
          id?: string
          last_test_at?: string | null
          openai_api_key?: string | null
          sandbox_address?: string | null
          sandbox_business_hours?: Json | null
          sandbox_categories?: Json | null
          sandbox_products?: Json | null
          sandbox_store_description?: string | null
          sandbox_store_name?: string | null
          sandbox_whatsapp?: string | null
          test_instance_id?: string | null
          test_instance_name?: string | null
          test_instance_qr_code?: string | null
          test_instance_status?: string | null
          test_logs?: Json | null
          test_messages_count?: number | null
          test_phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string
          bot_debounce_time?: number | null
          bot_delay_message?: number | null
          bot_enabled?: boolean | null
          bot_evolution_id?: string | null
          bot_expire_minutes?: number | null
          bot_keep_open?: boolean | null
          bot_keyword_finish?: string | null
          bot_listening_from_me?: boolean | null
          bot_name?: string | null
          bot_split_messages?: boolean | null
          bot_stop_from_me?: boolean | null
          bot_system_prompt?: string | null
          bot_time_per_char?: number | null
          bot_trigger_type?: string | null
          bot_trigger_value?: string | null
          bot_unknown_message?: string | null
          created_at?: string | null
          id?: string
          last_test_at?: string | null
          openai_api_key?: string | null
          sandbox_address?: string | null
          sandbox_business_hours?: Json | null
          sandbox_categories?: Json | null
          sandbox_products?: Json | null
          sandbox_store_description?: string | null
          sandbox_store_name?: string | null
          sandbox_whatsapp?: string | null
          test_instance_id?: string | null
          test_instance_name?: string | null
          test_instance_qr_code?: string | null
          test_instance_status?: string | null
          test_logs?: Json | null
          test_messages_count?: number | null
          test_phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      master_test_messages: {
        Row: {
          country_code: string
          created_by: string | null
          error_message: string | null
          evolution_message_id: string | null
          id: string
          message: string
          phone_number: string
          sent_at: string | null
          status: string
        }
        Insert: {
          country_code?: string
          created_by?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message: string
          phone_number: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          country_code?: string
          created_by?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message?: string
          phone_number?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      master_whatsapp_config: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          evolution_instance_id: string | null
          fallback_phone: string | null
          id: string
          instance_name: string | null
          instance_phone: string | null
          instance_status: string | null
          notification_country_code: string | null
          notification_phone: string | null
          notify_daily_summary: boolean | null
          notify_instance_disconnected: boolean | null
          notify_new_lead: boolean | null
          notify_new_order: boolean | null
          notify_new_seller: boolean | null
          notify_new_store: boolean | null
          notify_payment_received: boolean | null
          openai_api_key: string | null
          openai_model: string | null
          primary_bot_type: string | null
          recruitment_bot_approach: string | null
          recruitment_bot_auto_reactivate_minutes: number | null
          recruitment_bot_debounce_time: number | null
          recruitment_bot_delay_message: number | null
          recruitment_bot_enabled: boolean | null
          recruitment_bot_evolution_id: string | null
          recruitment_bot_expire_minutes: number | null
          recruitment_bot_keep_open: boolean | null
          recruitment_bot_keyword_finish: string | null
          recruitment_bot_keywords: string[] | null
          recruitment_bot_listening_from_me: boolean | null
          recruitment_bot_split_messages: boolean | null
          recruitment_bot_stop_from_me: boolean | null
          recruitment_bot_time_per_char: number | null
          recruitment_bot_trigger_operator: string | null
          recruitment_bot_trigger_type: string | null
          recruitment_bot_unknown_message: string | null
          sales_bot_approach: string | null
          sales_bot_auto_reactivate_minutes: number | null
          sales_bot_debounce_time: number | null
          sales_bot_delay_message: number | null
          sales_bot_enabled: boolean | null
          sales_bot_evolution_id: string | null
          sales_bot_expire_minutes: number | null
          sales_bot_keep_open: boolean | null
          sales_bot_keyword_finish: string | null
          sales_bot_keywords: string[] | null
          sales_bot_listening_from_me: boolean | null
          sales_bot_split_messages: boolean | null
          sales_bot_stop_from_me: boolean | null
          sales_bot_time_per_char: number | null
          sales_bot_trigger_operator: string | null
          sales_bot_trigger_type: string | null
          sales_bot_unknown_message: string | null
          support_bot_auto_reactivate_minutes: number | null
          support_bot_custom_prompt: string | null
          support_bot_debounce_time: number | null
          support_bot_delay_message: number | null
          support_bot_enabled: boolean | null
          support_bot_evolution_id: string | null
          support_bot_expire_minutes: number | null
          support_bot_keep_open: boolean | null
          support_bot_keyword_finish: string | null
          support_bot_keywords: string[] | null
          support_bot_listening_from_me: boolean | null
          support_bot_split_messages: boolean | null
          support_bot_stop_from_me: boolean | null
          support_bot_time_per_char: number | null
          support_bot_trigger_operator: string | null
          support_bot_trigger_type: string | null
          support_bot_unknown_message: string | null
          updated_at: string | null
          whatsapp_messages: Json | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          evolution_instance_id?: string | null
          fallback_phone?: string | null
          id?: string
          instance_name?: string | null
          instance_phone?: string | null
          instance_status?: string | null
          notification_country_code?: string | null
          notification_phone?: string | null
          notify_daily_summary?: boolean | null
          notify_instance_disconnected?: boolean | null
          notify_new_lead?: boolean | null
          notify_new_order?: boolean | null
          notify_new_seller?: boolean | null
          notify_new_store?: boolean | null
          notify_payment_received?: boolean | null
          openai_api_key?: string | null
          openai_model?: string | null
          primary_bot_type?: string | null
          recruitment_bot_approach?: string | null
          recruitment_bot_auto_reactivate_minutes?: number | null
          recruitment_bot_debounce_time?: number | null
          recruitment_bot_delay_message?: number | null
          recruitment_bot_enabled?: boolean | null
          recruitment_bot_evolution_id?: string | null
          recruitment_bot_expire_minutes?: number | null
          recruitment_bot_keep_open?: boolean | null
          recruitment_bot_keyword_finish?: string | null
          recruitment_bot_keywords?: string[] | null
          recruitment_bot_listening_from_me?: boolean | null
          recruitment_bot_split_messages?: boolean | null
          recruitment_bot_stop_from_me?: boolean | null
          recruitment_bot_time_per_char?: number | null
          recruitment_bot_trigger_operator?: string | null
          recruitment_bot_trigger_type?: string | null
          recruitment_bot_unknown_message?: string | null
          sales_bot_approach?: string | null
          sales_bot_auto_reactivate_minutes?: number | null
          sales_bot_debounce_time?: number | null
          sales_bot_delay_message?: number | null
          sales_bot_enabled?: boolean | null
          sales_bot_evolution_id?: string | null
          sales_bot_expire_minutes?: number | null
          sales_bot_keep_open?: boolean | null
          sales_bot_keyword_finish?: string | null
          sales_bot_keywords?: string[] | null
          sales_bot_listening_from_me?: boolean | null
          sales_bot_split_messages?: boolean | null
          sales_bot_stop_from_me?: boolean | null
          sales_bot_time_per_char?: number | null
          sales_bot_trigger_operator?: string | null
          sales_bot_trigger_type?: string | null
          sales_bot_unknown_message?: string | null
          support_bot_auto_reactivate_minutes?: number | null
          support_bot_custom_prompt?: string | null
          support_bot_debounce_time?: number | null
          support_bot_delay_message?: number | null
          support_bot_enabled?: boolean | null
          support_bot_evolution_id?: string | null
          support_bot_expire_minutes?: number | null
          support_bot_keep_open?: boolean | null
          support_bot_keyword_finish?: string | null
          support_bot_keywords?: string[] | null
          support_bot_listening_from_me?: boolean | null
          support_bot_split_messages?: boolean | null
          support_bot_stop_from_me?: boolean | null
          support_bot_time_per_char?: number | null
          support_bot_trigger_operator?: string | null
          support_bot_trigger_type?: string | null
          support_bot_unknown_message?: string | null
          updated_at?: string | null
          whatsapp_messages?: Json | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          evolution_instance_id?: string | null
          fallback_phone?: string | null
          id?: string
          instance_name?: string | null
          instance_phone?: string | null
          instance_status?: string | null
          notification_country_code?: string | null
          notification_phone?: string | null
          notify_daily_summary?: boolean | null
          notify_instance_disconnected?: boolean | null
          notify_new_lead?: boolean | null
          notify_new_order?: boolean | null
          notify_new_seller?: boolean | null
          notify_new_store?: boolean | null
          notify_payment_received?: boolean | null
          openai_api_key?: string | null
          openai_model?: string | null
          primary_bot_type?: string | null
          recruitment_bot_approach?: string | null
          recruitment_bot_auto_reactivate_minutes?: number | null
          recruitment_bot_debounce_time?: number | null
          recruitment_bot_delay_message?: number | null
          recruitment_bot_enabled?: boolean | null
          recruitment_bot_evolution_id?: string | null
          recruitment_bot_expire_minutes?: number | null
          recruitment_bot_keep_open?: boolean | null
          recruitment_bot_keyword_finish?: string | null
          recruitment_bot_keywords?: string[] | null
          recruitment_bot_listening_from_me?: boolean | null
          recruitment_bot_split_messages?: boolean | null
          recruitment_bot_stop_from_me?: boolean | null
          recruitment_bot_time_per_char?: number | null
          recruitment_bot_trigger_operator?: string | null
          recruitment_bot_trigger_type?: string | null
          recruitment_bot_unknown_message?: string | null
          sales_bot_approach?: string | null
          sales_bot_auto_reactivate_minutes?: number | null
          sales_bot_debounce_time?: number | null
          sales_bot_delay_message?: number | null
          sales_bot_enabled?: boolean | null
          sales_bot_evolution_id?: string | null
          sales_bot_expire_minutes?: number | null
          sales_bot_keep_open?: boolean | null
          sales_bot_keyword_finish?: string | null
          sales_bot_keywords?: string[] | null
          sales_bot_listening_from_me?: boolean | null
          sales_bot_split_messages?: boolean | null
          sales_bot_stop_from_me?: boolean | null
          sales_bot_time_per_char?: number | null
          sales_bot_trigger_operator?: string | null
          sales_bot_trigger_type?: string | null
          sales_bot_unknown_message?: string | null
          support_bot_auto_reactivate_minutes?: number | null
          support_bot_custom_prompt?: string | null
          support_bot_debounce_time?: number | null
          support_bot_delay_message?: number | null
          support_bot_enabled?: boolean | null
          support_bot_evolution_id?: string | null
          support_bot_expire_minutes?: number | null
          support_bot_keep_open?: boolean | null
          support_bot_keyword_finish?: string | null
          support_bot_keywords?: string[] | null
          support_bot_listening_from_me?: boolean | null
          support_bot_split_messages?: boolean | null
          support_bot_stop_from_me?: boolean | null
          support_bot_time_per_char?: number | null
          support_bot_trigger_operator?: string | null
          support_bot_trigger_type?: string | null
          support_bot_unknown_message?: string | null
          updated_at?: string | null
          whatsapp_messages?: Json | null
        }
        Relationships: []
      }
      master_whatsapp_sessions: {
        Row: {
          active_bot_type: string | null
          bot_paused: boolean | null
          config_id: string | null
          contact_name: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          messages_count: number | null
          paused_at: string | null
          paused_reason: string | null
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          active_bot_type?: string | null
          bot_paused?: boolean | null
          config_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          messages_count?: number | null
          paused_at?: string | null
          paused_reason?: string | null
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          active_bot_type?: string | null
          bot_paused?: boolean | null
          config_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          messages_count?: number | null
          paused_at?: string | null
          paused_reason?: string | null
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_whatsapp_sessions_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "master_whatsapp_config"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_contract_acceptance: {
        Row: {
          accepted_at: string
          business_info_declaration: boolean | null
          company_authorization: boolean | null
          compliance_commitment: boolean | null
          contract_template_id: string | null
          contract_version: string
          cookies_accepted: boolean | null
          created_at: string | null
          id: string
          ip_address: string | null
          marketing_accepted: boolean | null
          privacy_accepted: boolean | null
          store_id: string | null
          terms_accepted: boolean | null
          user_agent: string | null
          user_id: string
          verification_hash: string | null
        }
        Insert: {
          accepted_at?: string
          business_info_declaration?: boolean | null
          company_authorization?: boolean | null
          compliance_commitment?: boolean | null
          contract_template_id?: string | null
          contract_version: string
          cookies_accepted?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          marketing_accepted?: boolean | null
          privacy_accepted?: boolean | null
          store_id?: string | null
          terms_accepted?: boolean | null
          user_agent?: string | null
          user_id: string
          verification_hash?: string | null
        }
        Update: {
          accepted_at?: string
          business_info_declaration?: boolean | null
          company_authorization?: boolean | null
          compliance_commitment?: boolean | null
          contract_template_id?: string | null
          contract_version?: string
          cookies_accepted?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          marketing_accepted?: boolean | null
          privacy_accepted?: boolean | null
          store_id?: string | null
          terms_accepted?: boolean | null
          user_agent?: string | null
          user_id?: string
          verification_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_contract_acceptance_contract_template_id_fkey"
            columns: ["contract_template_id"]
            isOneToOne: false
            referencedRelation: "merchant_contract_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_contract_acceptance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_contract_acceptance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_contract_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          title: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          version?: string
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
          key: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
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
          estimated_delivery_minutes: number | null
          external_data: Json | null
          external_id: string | null
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
          short_reference: string | null
          source: string | null
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
          estimated_delivery_minutes?: number | null
          external_data?: Json | null
          external_id?: string | null
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
          short_reference?: string | null
          source?: string | null
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
          estimated_delivery_minutes?: number | null
          external_data?: Json | null
          external_id?: string | null
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
          short_reference?: string | null
          source?: string | null
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
      password_call_config: {
        Row: {
          audio_type: string | null
          call_type: string
          created_at: string
          custom_prefix: string | null
          custom_suffix: string | null
          custom_text_enabled: boolean | null
          custom_text_template: string | null
          elevenlabs_api_key: string | null
          elevenlabs_voice_id: string | null
          enable_order_call_button: boolean | null
          highlight_duration_ms: number
          history_count: number
          id: string
          is_enabled: boolean
          primary_color: string | null
          show_history: boolean
          show_in_orders_page: boolean | null
          sound_enabled: boolean
          store_id: string
          store_name_in_call: string | null
          template: string
          updated_at: string
          use_greeting: boolean | null
          voice_text_template: string | null
        }
        Insert: {
          audio_type?: string | null
          call_type?: string
          created_at?: string
          custom_prefix?: string | null
          custom_suffix?: string | null
          custom_text_enabled?: boolean | null
          custom_text_template?: string | null
          elevenlabs_api_key?: string | null
          elevenlabs_voice_id?: string | null
          enable_order_call_button?: boolean | null
          highlight_duration_ms?: number
          history_count?: number
          id?: string
          is_enabled?: boolean
          primary_color?: string | null
          show_history?: boolean
          show_in_orders_page?: boolean | null
          sound_enabled?: boolean
          store_id: string
          store_name_in_call?: string | null
          template?: string
          updated_at?: string
          use_greeting?: boolean | null
          voice_text_template?: string | null
        }
        Update: {
          audio_type?: string | null
          call_type?: string
          created_at?: string
          custom_prefix?: string | null
          custom_suffix?: string | null
          custom_text_enabled?: boolean | null
          custom_text_template?: string | null
          elevenlabs_api_key?: string | null
          elevenlabs_voice_id?: string | null
          enable_order_call_button?: boolean | null
          highlight_duration_ms?: number
          history_count?: number
          id?: string
          is_enabled?: boolean
          primary_color?: string | null
          show_history?: boolean
          show_in_orders_page?: boolean | null
          sound_enabled?: boolean
          store_id?: string
          store_name_in_call?: string | null
          template?: string
          updated_at?: string
          use_greeting?: boolean | null
          voice_text_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_call_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_call_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      password_calls: {
        Row: {
          call_number: string
          call_type: string
          created_at: string
          customer_name: string | null
          id: string
          order_id: string | null
          store_id: string
        }
        Insert: {
          call_number: string
          call_type?: string
          created_at?: string
          customer_name?: string | null
          id?: string
          order_id?: string | null
          store_id: string
        }
        Update: {
          call_number?: string
          call_type?: string
          created_at?: string
          customer_name?: string | null
          id?: string
          order_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_calls_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_calls_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_calls_store_id_fkey"
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
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          payment_amount: number
          payment_method: string
          payment_proof_url: string | null
          phone: string | null
          pix_copia_cola: string | null
          pix_expires_at: string | null
          pix_key: string | null
          pix_location: string | null
          pix_qrcode_base64: string | null
          pix_txid: string | null
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
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_amount: number
          payment_method?: string
          payment_proof_url?: string | null
          phone?: string | null
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_key?: string | null
          pix_location?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
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
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_method?: string
          payment_proof_url?: string | null
          phone?: string | null
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_key?: string | null
          pix_location?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
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
            foreignKeyName: "payment_approvals_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
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
          recurrence_days: number | null
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
          recurrence_days?: number | null
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
          recurrence_days?: number | null
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
          accepted_terms_version: string | null
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
          terms_accepted_at: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          accepted_terms_version?: string | null
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
          terms_accepted_at?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          accepted_terms_version?: string | null
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
          terms_accepted_at?: string | null
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
      qualification_benefit_tiers: {
        Row: {
          benefit_description: string
          created_at: string | null
          emoji: string
          followup_days: number | null
          free_days: number | null
          id: string
          include_consulting: boolean | null
          include_followup: boolean | null
          is_active: boolean | null
          max_points: number
          min_points: number
          promotion_id: string | null
          tier_name: string
          tier_order: number
          updated_at: string | null
        }
        Insert: {
          benefit_description: string
          created_at?: string | null
          emoji: string
          followup_days?: number | null
          free_days?: number | null
          id?: string
          include_consulting?: boolean | null
          include_followup?: boolean | null
          is_active?: boolean | null
          max_points: number
          min_points: number
          promotion_id?: string | null
          tier_name: string
          tier_order: number
          updated_at?: string | null
        }
        Update: {
          benefit_description?: string
          created_at?: string | null
          emoji?: string
          followup_days?: number | null
          free_days?: number | null
          id?: string
          include_consulting?: boolean | null
          include_followup?: boolean | null
          is_active?: boolean | null
          max_points?: number
          min_points?: number
          promotion_id?: string | null
          tier_name?: string
          tier_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_benefit_tiers_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_tier_edit_history: {
        Row: {
          change_type: string
          edited_at: string | null
          edited_by: string
          id: string
          new_values: Json | null
          previous_values: Json | null
          promotion_changed: boolean | null
          template_applied: string | null
          tier_id: string | null
        }
        Insert: {
          change_type: string
          edited_at?: string | null
          edited_by: string
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
          promotion_changed?: boolean | null
          template_applied?: string | null
          tier_id?: string | null
        }
        Update: {
          change_type?: string
          edited_at?: string | null
          edited_by?: string
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
          promotion_changed?: boolean | null
          template_applied?: string | null
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_tier_edit_history_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "qualification_benefit_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_tier_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          template_name: string
          template_type: string
          tier_configs: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          template_name: string
          template_type: string
          tier_configs: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          template_name?: string
          template_type?: string
          tier_configs?: Json
        }
        Relationships: []
      }
      rate_limit_attempts: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          created_at: string
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      sales_media: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          niche: string | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          niche?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          niche?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      salespeople: {
        Row: {
          active_clients_count: number | null
          approved_at: string | null
          approved_by: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          bonus_eligible: boolean | null
          cnae_codes: string[]
          cnpj: string | null
          cnpj_validated: boolean | null
          cnpj_validated_at: string | null
          cnpj_validation_data: Json | null
          commission_percentage: number | null
          commission_suspended_at: string | null
          commission_tier: string | null
          company_name: string | null
          company_trade_name: string | null
          contract_accepted_at: string | null
          cpf: string | null
          created_at: string | null
          current_month_earnings: number | null
          email: string
          full_name: string
          id: string
          is_blocked: boolean | null
          last_earnings_reset_at: string | null
          last_sale_at: string | null
          last_tier_evaluation_at: string | null
          monthly_earnings_limit: number | null
          phone: string
          pix_key: string | null
          pix_key_type: string | null
          profile_photo_url: string | null
          qualification_answers: Json | null
          qualification_level: string | null
          qualification_score: number | null
          referral_code: string
          rejection_reason: string | null
          salesperson_type: string
          status: string
          suspension_reason: string | null
          tier_warning_sent_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_clients_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          bonus_eligible?: boolean | null
          cnae_codes?: string[]
          cnpj?: string | null
          cnpj_validated?: boolean | null
          cnpj_validated_at?: string | null
          cnpj_validation_data?: Json | null
          commission_percentage?: number | null
          commission_suspended_at?: string | null
          commission_tier?: string | null
          company_name?: string | null
          company_trade_name?: string | null
          contract_accepted_at?: string | null
          cpf?: string | null
          created_at?: string | null
          current_month_earnings?: number | null
          email: string
          full_name: string
          id?: string
          is_blocked?: boolean | null
          last_earnings_reset_at?: string | null
          last_sale_at?: string | null
          last_tier_evaluation_at?: string | null
          monthly_earnings_limit?: number | null
          phone: string
          pix_key?: string | null
          pix_key_type?: string | null
          profile_photo_url?: string | null
          qualification_answers?: Json | null
          qualification_level?: string | null
          qualification_score?: number | null
          referral_code: string
          rejection_reason?: string | null
          salesperson_type?: string
          status?: string
          suspension_reason?: string | null
          tier_warning_sent_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_clients_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          bonus_eligible?: boolean | null
          cnae_codes?: string[]
          cnpj?: string | null
          cnpj_validated?: boolean | null
          cnpj_validated_at?: string | null
          cnpj_validation_data?: Json | null
          commission_percentage?: number | null
          commission_suspended_at?: string | null
          commission_tier?: string | null
          company_name?: string | null
          company_trade_name?: string | null
          contract_accepted_at?: string | null
          cpf?: string | null
          created_at?: string | null
          current_month_earnings?: number | null
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean | null
          last_earnings_reset_at?: string | null
          last_sale_at?: string | null
          last_tier_evaluation_at?: string | null
          monthly_earnings_limit?: number | null
          phone?: string
          pix_key?: string | null
          pix_key_type?: string | null
          profile_photo_url?: string | null
          qualification_answers?: Json | null
          qualification_level?: string | null
          qualification_score?: number | null
          referral_code?: string
          rejection_reason?: string | null
          salesperson_type?: string
          status?: string
          suspension_reason?: string | null
          tier_warning_sent_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salespeople_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salespeople_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_activity_rules: {
        Row: {
          allow_reactivation: boolean
          created_at: string
          created_by: string | null
          evaluation_period: string
          full_commission_percentage: number
          grace_period_days: number
          id: string
          is_active: boolean
          minimum_commission_percentage: number
          notify_days_before: number
          reactivation_requires_new_sale: boolean
          reduced_commission_percentage: number
          tier_full_commission: number
          tier_minimum_commission: number
          tier_reduced_commission: number
          updated_at: string
        }
        Insert: {
          allow_reactivation?: boolean
          created_at?: string
          created_by?: string | null
          evaluation_period?: string
          full_commission_percentage?: number
          grace_period_days?: number
          id?: string
          is_active?: boolean
          minimum_commission_percentage?: number
          notify_days_before?: number
          reactivation_requires_new_sale?: boolean
          reduced_commission_percentage?: number
          tier_full_commission?: number
          tier_minimum_commission?: number
          tier_reduced_commission?: number
          updated_at?: string
        }
        Update: {
          allow_reactivation?: boolean
          created_at?: string
          created_by?: string | null
          evaluation_period?: string
          full_commission_percentage?: number
          grace_period_days?: number
          id?: string
          is_active?: boolean
          minimum_commission_percentage?: number
          notify_days_before?: number
          reactivation_requires_new_sale?: boolean
          reduced_commission_percentage?: number
          tier_full_commission?: number
          tier_minimum_commission?: number
          tier_reduced_commission?: number
          updated_at?: string
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
            isOneToOne: true
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_commissions: {
        Row: {
          applies_to: string
          commission_amount: number
          commission_fixed_amount: number | null
          commission_percentage: number | null
          commission_type: string
          created_at: string | null
          id: string
          paid_at: string | null
          paid_by: string | null
          payment_amount: number
          payment_approval_id: string
          payment_reference: string | null
          payment_sequence: number | null
          plan_name: string | null
          salesperson_id: string
          status: string
          store_id: string | null
          store_name: string | null
          updated_at: string | null
        }
        Insert: {
          applies_to: string
          commission_amount: number
          commission_fixed_amount?: number | null
          commission_percentage?: number | null
          commission_type: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_amount: number
          payment_approval_id: string
          payment_reference?: string | null
          payment_sequence?: number | null
          plan_name?: string | null
          salesperson_id: string
          status?: string
          store_id?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string
          commission_amount?: number
          commission_fixed_amount?: number | null
          commission_percentage?: number | null
          commission_type?: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_amount?: number
          payment_approval_id?: string
          payment_reference?: string | null
          payment_sequence?: number | null
          plan_name?: string | null
          salesperson_id?: string
          status?: string
          store_id?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_commissions_payment_approval_id_fkey"
            columns: ["payment_approval_id"]
            isOneToOne: false
            referencedRelation: "payment_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_commissions_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_contract_templates: {
        Row: {
          company_address: string | null
          company_city: string
          company_cnpj: string
          company_name: string
          company_state: string | null
          contract_text: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          version: string
        }
        Insert: {
          company_address?: string | null
          company_city: string
          company_cnpj: string
          company_name: string
          company_state?: string | null
          contract_text: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version: string
        }
        Update: {
          company_address?: string | null
          company_city?: string
          company_cnpj?: string
          company_name?: string
          company_state?: string | null
          contract_text?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      salesperson_contracts: {
        Row: {
          accepted_at: string
          bonus_terms: Json | null
          cnae_requirements: string[] | null
          commission_terms: Json
          contract_template_id: string | null
          contract_text: string
          created_at: string | null
          id: string
          ip_address: string | null
          salesperson_cnpj: string | null
          salesperson_id: string
          salesperson_name: string | null
          user_agent: string | null
          verification_hash: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          bonus_terms?: Json | null
          cnae_requirements?: string[] | null
          commission_terms: Json
          contract_template_id?: string | null
          contract_text: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          salesperson_cnpj?: string | null
          salesperson_id: string
          salesperson_name?: string | null
          user_agent?: string | null
          verification_hash?: string | null
          version: string
        }
        Update: {
          accepted_at?: string
          bonus_terms?: Json | null
          cnae_requirements?: string[] | null
          commission_terms?: Json
          contract_template_id?: string | null
          contract_text?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          salesperson_cnpj?: string | null
          salesperson_id?: string
          salesperson_name?: string | null
          user_agent?: string | null
          verification_hash?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_contracts_contract_template_id_fkey"
            columns: ["contract_template_id"]
            isOneToOne: false
            referencedRelation: "salesperson_contract_templates"
            referencedColumns: ["id"]
          },
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
      salesperson_portfolio_evaluations: {
        Row: {
          active_clients_count: number
          churned_clients_count: number
          created_at: string
          evaluated_at: string
          evaluated_by: string | null
          evaluation_period_end: string
          evaluation_period_start: string
          id: string
          new_commission_percentage: number
          new_sales_count: number
          new_tier: string
          notes: string | null
          previous_commission_percentage: number | null
          previous_tier: string | null
          salesperson_id: string
        }
        Insert: {
          active_clients_count?: number
          churned_clients_count?: number
          created_at?: string
          evaluated_at?: string
          evaluated_by?: string | null
          evaluation_period_end: string
          evaluation_period_start: string
          id?: string
          new_commission_percentage: number
          new_sales_count?: number
          new_tier: string
          notes?: string | null
          previous_commission_percentage?: number | null
          previous_tier?: string | null
          salesperson_id: string
        }
        Update: {
          active_clients_count?: number
          churned_clients_count?: number
          created_at?: string
          evaluated_at?: string
          evaluated_by?: string | null
          evaluation_period_end?: string
          evaluation_period_start?: string
          id?: string
          new_commission_percentage?: number
          new_sales_count?: number
          new_tier?: string
          notes?: string | null
          previous_commission_percentage?: number | null
          previous_tier?: string | null
          salesperson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_portfolio_evaluations_salesperson_id_fkey"
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
      salesperson_terms_acceptance: {
        Row: {
          accepted_at: string
          created_at: string | null
          id: string
          ip_address: string | null
          salesperson_id: string
          terms_type: string
          terms_version: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          salesperson_id: string
          terms_type: string
          terms_version: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          salesperson_id?: string
          terms_type?: string
          terms_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_terms_acceptance_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
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
      sentinela_reminders: {
        Row: {
          conversion_order_id: string | null
          converted_at: string | null
          created_at: string | null
          customer_id: string
          error_message: string | null
          id: string
          message_sent: string | null
          order_id: string | null
          product_id: string | null
          rule_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          conversion_order_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          customer_id: string
          error_message?: string | null
          id?: string
          message_sent?: string | null
          order_id?: string | null
          product_id?: string | null
          rule_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          conversion_order_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          customer_id?: string
          error_message?: string | null
          id?: string
          message_sent?: string | null
          order_id?: string | null
          product_id?: string | null
          rule_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentinela_reminders_conversion_order_id_fkey"
            columns: ["conversion_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_reminders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_reminders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_reminders_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "sentinela_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_reminders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_reminders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sentinela_rules: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          message_template: string | null
          product_id: string | null
          recurrence_days: number
          reminder_days_before: number
          store_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          product_id?: string | null
          recurrence_days?: number
          reminder_days_before?: number
          store_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          product_id?: string | null
          recurrence_days?: number
          reminder_days_before?: number
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentinela_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sentinela_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentinela_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_bot_config: {
        Row: {
          auto_reactivate_minutes: number | null
          bot_name: string | null
          bot_split_messages: boolean | null
          bot_time_per_char: number | null
          created_at: string | null
          custom_greeting: string | null
          debounce_time: number | null
          delay_message: number | null
          emoji_level: string | null
          enabled: boolean | null
          evolution_bot_id: string | null
          evolution_bot_status: string | null
          expire_minutes: number | null
          id: string
          ignore_jids: string[] | null
          include_business_hours: boolean | null
          include_delivery_fee: boolean | null
          include_location: boolean | null
          include_min_order: boolean | null
          include_payment_methods: boolean | null
          keep_open: boolean | null
          keyword_finish: string | null
          listening_from_me: boolean | null
          personality: string | null
          stop_bot_from_me: boolean | null
          store_id: string
          trigger_operator: string | null
          trigger_type: string | null
          trigger_value: string | null
          unknown_message: string | null
          updated_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          auto_reactivate_minutes?: number | null
          bot_name?: string | null
          bot_split_messages?: boolean | null
          bot_time_per_char?: number | null
          created_at?: string | null
          custom_greeting?: string | null
          debounce_time?: number | null
          delay_message?: number | null
          emoji_level?: string | null
          enabled?: boolean | null
          evolution_bot_id?: string | null
          evolution_bot_status?: string | null
          expire_minutes?: number | null
          id?: string
          ignore_jids?: string[] | null
          include_business_hours?: boolean | null
          include_delivery_fee?: boolean | null
          include_location?: boolean | null
          include_min_order?: boolean | null
          include_payment_methods?: boolean | null
          keep_open?: boolean | null
          keyword_finish?: string | null
          listening_from_me?: boolean | null
          personality?: string | null
          stop_bot_from_me?: boolean | null
          store_id: string
          trigger_operator?: string | null
          trigger_type?: string | null
          trigger_value?: string | null
          unknown_message?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          auto_reactivate_minutes?: number | null
          bot_name?: string | null
          bot_split_messages?: boolean | null
          bot_time_per_char?: number | null
          created_at?: string | null
          custom_greeting?: string | null
          debounce_time?: number | null
          delay_message?: number | null
          emoji_level?: string | null
          enabled?: boolean | null
          evolution_bot_id?: string | null
          evolution_bot_status?: string | null
          expire_minutes?: number | null
          id?: string
          ignore_jids?: string[] | null
          include_business_hours?: boolean | null
          include_delivery_fee?: boolean | null
          include_location?: boolean | null
          include_min_order?: boolean | null
          include_payment_methods?: boolean | null
          keep_open?: boolean | null
          keyword_finish?: string | null
          listening_from_me?: boolean | null
          personality?: string | null
          stop_bot_from_me?: boolean | null
          store_id?: string
          trigger_operator?: string | null
          trigger_type?: string | null
          trigger_value?: string | null
          unknown_message?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_bot_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_bot_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_bot_config_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      store_configurations: {
        Row: {
          accept_outside_delivery_zone: boolean | null
          created_at: string
          custom_scripts: Json | null
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
          custom_scripts?: Json | null
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
          custom_scripts?: Json | null
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
      store_efi_data: {
        Row: {
          authorization_link_sent_at: string | null
          authorized_at: string | null
          birth_date: string | null
          created_at: string | null
          efi_identifier: string | null
          id: string
          mother_name: string | null
          person_type: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          authorization_link_sent_at?: string | null
          authorized_at?: string | null
          birth_date?: string | null
          created_at?: string | null
          efi_identifier?: string | null
          id?: string
          mother_name?: string | null
          person_type: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          authorization_link_sent_at?: string | null
          authorized_at?: string | null
          birth_date?: string | null
          created_at?: string | null
          efi_identifier?: string | null
          id?: string
          mother_name?: string | null
          person_type?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_efi_data_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_efi_data_store_id_fkey"
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
      store_modules: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          created_at: string
          id: string
          is_enabled: boolean
          module_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_modules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_modules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_signage_config: {
        Row: {
          background_color: string
          clock_position: string
          clock_size: string
          created_at: string
          id: string
          is_enabled: boolean
          orientation: string
          show_clock: boolean
          store_id: string
          transition_duration_ms: number
          transition_type: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          clock_position?: string
          clock_size?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          orientation?: string
          show_clock?: boolean
          store_id: string
          transition_duration_ms?: number
          transition_type?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          clock_position?: string
          clock_size?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          orientation?: string
          show_clock?: boolean
          store_id?: string
          transition_duration_ms?: number
          transition_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_signage_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_signage_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_signage_items: {
        Row: {
          created_at: string
          duration_seconds: number
          file_type: string
          file_url: string
          has_audio: boolean | null
          id: string
          is_active: boolean
          sort_order: number
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          file_type?: string
          file_url: string
          has_audio?: boolean | null
          id?: string
          is_active?: boolean
          sort_order?: number
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          file_type?: string
          file_url?: string
          has_audio?: boolean | null
          id?: string
          is_active?: boolean
          sort_order?: number
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_signage_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_signage_items_store_id_fkey"
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
          efi_account_id: string | null
          efi_account_number: string | null
          efi_account_status: string | null
          efi_certificate_pem: string | null
          efi_client_id: string | null
          efi_client_secret: string | null
          efi_document_number: string | null
          efi_document_type: string | null
          efi_pix_enabled: boolean | null
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
          new_order_message_template: string | null
          notification_country_code: string | null
          notification_country_code_2: string | null
          notification_phone: string | null
          notification_phone_2: string | null
          notify_new_orders: boolean | null
          online_payment_commission: number | null
          openai_api_key: string | null
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
          sentinela_default_template: string | null
          sentinela_enabled: boolean | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["store_status"]
          subscription_expires_at: string | null
          theme_colors: Json | null
          timezone: string | null
          updated_at: string
          use_master_for_notifications: boolean | null
          wants_online_payment: boolean | null
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
          efi_account_id?: string | null
          efi_account_number?: string | null
          efi_account_status?: string | null
          efi_certificate_pem?: string | null
          efi_client_id?: string | null
          efi_client_secret?: string | null
          efi_document_number?: string | null
          efi_document_type?: string | null
          efi_pix_enabled?: boolean | null
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
          new_order_message_template?: string | null
          notification_country_code?: string | null
          notification_country_code_2?: string | null
          notification_phone?: string | null
          notification_phone_2?: string | null
          notify_new_orders?: boolean | null
          online_payment_commission?: number | null
          openai_api_key?: string | null
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
          sentinela_default_template?: string | null
          sentinela_enabled?: boolean | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          subscription_expires_at?: string | null
          theme_colors?: Json | null
          timezone?: string | null
          updated_at?: string
          use_master_for_notifications?: boolean | null
          wants_online_payment?: boolean | null
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
          efi_account_id?: string | null
          efi_account_number?: string | null
          efi_account_status?: string | null
          efi_certificate_pem?: string | null
          efi_client_id?: string | null
          efi_client_secret?: string | null
          efi_document_number?: string | null
          efi_document_type?: string | null
          efi_pix_enabled?: boolean | null
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
          new_order_message_template?: string | null
          notification_country_code?: string | null
          notification_country_code_2?: string | null
          notification_phone?: string | null
          notification_phone_2?: string | null
          notify_new_orders?: boolean | null
          online_payment_commission?: number | null
          openai_api_key?: string | null
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
          sentinela_default_template?: string | null
          sentinela_enabled?: boolean | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          subscription_expires_at?: string | null
          theme_colors?: Json | null
          timezone?: string | null
          updated_at?: string
          use_master_for_notifications?: boolean | null
          wants_online_payment?: boolean | null
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
          pix_copia_cola: string | null
          pix_expires_at: string | null
          pix_key: string | null
          pix_qr_code: string | null
          pix_qrcode_base64: string | null
          pix_txid: string | null
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
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_key?: string | null
          pix_qr_code?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
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
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_key?: string | null
          pix_qr_code?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
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
          account_webhook_configured: boolean | null
          account_webhook_configured_at: string | null
          account_webhook_url: string | null
          agency: string | null
          bank_name: string | null
          created_at: string | null
          efi_certificate_pem: string | null
          efi_certificate_pem_production: string | null
          efi_client_id: string | null
          efi_client_id_production: string | null
          efi_client_secret: string | null
          efi_client_secret_production: string | null
          efi_environment: string | null
          efi_is_configured: boolean | null
          efi_last_test_at: string | null
          efi_last_test_status: string | null
          efi_pix_key: string | null
          efi_webhook_configured: boolean | null
          efi_webhook_configured_at: string | null
          efi_webhook_url: string | null
          enable_auto_approval: boolean | null
          enable_manual_approval: boolean | null
          id: string
          is_active: boolean | null
          master_referral_code: string | null
          payment_instructions: string | null
          pix_key: string
          pix_key_type: string
          support_email: string | null
          support_whatsapp: string | null
          support_whatsapp_message: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_number?: string | null
          account_webhook_configured?: boolean | null
          account_webhook_configured_at?: string | null
          account_webhook_url?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          efi_certificate_pem?: string | null
          efi_certificate_pem_production?: string | null
          efi_client_id?: string | null
          efi_client_id_production?: string | null
          efi_client_secret?: string | null
          efi_client_secret_production?: string | null
          efi_environment?: string | null
          efi_is_configured?: boolean | null
          efi_last_test_at?: string | null
          efi_last_test_status?: string | null
          efi_pix_key?: string | null
          efi_webhook_configured?: boolean | null
          efi_webhook_configured_at?: string | null
          efi_webhook_url?: string | null
          enable_auto_approval?: boolean | null
          enable_manual_approval?: boolean | null
          id?: string
          is_active?: boolean | null
          master_referral_code?: string | null
          payment_instructions?: string | null
          pix_key: string
          pix_key_type: string
          support_email?: string | null
          support_whatsapp?: string | null
          support_whatsapp_message?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string | null
          account_webhook_configured?: boolean | null
          account_webhook_configured_at?: string | null
          account_webhook_url?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          efi_certificate_pem?: string | null
          efi_certificate_pem_production?: string | null
          efi_client_id?: string | null
          efi_client_id_production?: string | null
          efi_client_secret?: string | null
          efi_client_secret_production?: string | null
          efi_environment?: string | null
          efi_is_configured?: boolean | null
          efi_last_test_at?: string | null
          efi_last_test_status?: string | null
          efi_pix_key?: string | null
          efi_webhook_configured?: boolean | null
          efi_webhook_configured_at?: string | null
          efi_webhook_url?: string | null
          enable_auto_approval?: boolean | null
          enable_manual_approval?: boolean | null
          id?: string
          is_active?: boolean | null
          master_referral_code?: string | null
          payment_instructions?: string | null
          pix_key?: string
          pix_key_type?: string
          support_email?: string | null
          support_whatsapp?: string | null
          support_whatsapp_message?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_banners: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          end_date: string | null
          html_content: string
          id: string
          is_active: boolean | null
          position: string | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          end_date?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          end_date?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_terms_config: {
        Row: {
          config_key: string
          config_value: string
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      system_update_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          update_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          update_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          update_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_update_images_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "system_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      system_updates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          importance: string | null
          is_published: boolean | null
          release_date: string
          title: string
          updated_at: string | null
          version: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          importance?: string | null
          is_published?: boolean | null
          release_date: string
          title: string
          updated_at?: string | null
          version: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          importance?: string | null
          is_published?: boolean | null
          release_date?: string
          title?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
        ]
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
      user_update_reads: {
        Row: {
          id: string
          read_at: string | null
          update_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          read_at?: string | null
          update_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          read_at?: string | null
          update_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_update_reads_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "system_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_update_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_update_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string
          ip_address: string | null
          payload: Json | null
          processed_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          source: string
          status: string
          webhook_type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json | null
          processed_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          source: string
          status?: string
          webhook_type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json | null
          processed_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          source?: string
          status?: string
          webhook_type?: string
        }
        Relationships: []
      }
      whatsapp_auto_messages: {
        Row: {
          created_at: string | null
          greeting_enabled: boolean | null
          greeting_message: string | null
          id: string
          is_enabled: boolean | null
          order_cancelled_enabled: boolean | null
          order_cancelled_message: string | null
          order_completed_enabled: boolean | null
          order_completed_message: string | null
          order_confirmed_enabled: boolean | null
          order_confirmed_message: string | null
          order_in_transit_enabled: boolean | null
          order_in_transit_message: string | null
          order_ready_enabled: boolean | null
          order_ready_message: string | null
          order_received_enabled: boolean | null
          order_received_message: string | null
          store_id: string
          test_phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          greeting_enabled?: boolean | null
          greeting_message?: string | null
          id?: string
          is_enabled?: boolean | null
          order_cancelled_enabled?: boolean | null
          order_cancelled_message?: string | null
          order_completed_enabled?: boolean | null
          order_completed_message?: string | null
          order_confirmed_enabled?: boolean | null
          order_confirmed_message?: string | null
          order_in_transit_enabled?: boolean | null
          order_in_transit_message?: string | null
          order_ready_enabled?: boolean | null
          order_ready_message?: string | null
          order_received_enabled?: boolean | null
          order_received_message?: string | null
          store_id: string
          test_phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          greeting_enabled?: boolean | null
          greeting_message?: string | null
          id?: string
          is_enabled?: boolean | null
          order_cancelled_enabled?: boolean | null
          order_cancelled_message?: string | null
          order_completed_enabled?: boolean | null
          order_completed_message?: string | null
          order_confirmed_enabled?: boolean | null
          order_confirmed_message?: string | null
          order_in_transit_enabled?: boolean | null
          order_in_transit_message?: string | null
          order_ready_enabled?: boolean | null
          order_ready_message?: string | null
          order_received_enabled?: boolean | null
          order_received_message?: string | null
          store_id?: string
          test_phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_auto_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_auto_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          custom_message: string | null
          daily_limit: number | null
          description: string | null
          end_hour: number | null
          filter_days_inactive: number | null
          filter_last_order_after: string | null
          filter_last_order_before: string | null
          filter_max_orders: number | null
          filter_max_spent: number | null
          filter_min_orders: number | null
          filter_min_spent: number | null
          id: string
          media_type: string | null
          media_url: string | null
          message_interval_seconds: number | null
          messages_delivered: number | null
          messages_failed: number | null
          messages_read: number | null
          messages_sent: number | null
          name: string
          pause_after_messages: number | null
          pause_duration_seconds: number | null
          scheduled_start_at: string | null
          start_hour: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["whatsapp_campaign_status"] | null
          store_id: string
          template_id: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          daily_limit?: number | null
          description?: string | null
          end_hour?: number | null
          filter_days_inactive?: number | null
          filter_last_order_after?: string | null
          filter_last_order_before?: string | null
          filter_max_orders?: number | null
          filter_max_spent?: number | null
          filter_min_orders?: number | null
          filter_min_spent?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_interval_seconds?: number | null
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_read?: number | null
          messages_sent?: number | null
          name: string
          pause_after_messages?: number | null
          pause_duration_seconds?: number | null
          scheduled_start_at?: string | null
          start_hour?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["whatsapp_campaign_status"]
            | null
          store_id: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          daily_limit?: number | null
          description?: string | null
          end_hour?: number | null
          filter_days_inactive?: number | null
          filter_last_order_after?: string | null
          filter_last_order_before?: string | null
          filter_max_orders?: number | null
          filter_max_spent?: number | null
          filter_min_orders?: number | null
          filter_min_spent?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_interval_seconds?: number | null
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_read?: number | null
          messages_sent?: number | null
          name?: string
          pause_after_messages?: number | null
          pause_duration_seconds?: number | null
          scheduled_start_at?: string | null
          start_hour?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["whatsapp_campaign_status"]
            | null
          store_id?: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contact_label_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          contact_id: string
          id: string
          label_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          contact_id: string
          id?: string
          label_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          contact_id?: string
          id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contact_label_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contact_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contact_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contact_labels: {
        Row: {
          color: string
          contacts_count: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          contacts_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          contacts_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contact_labels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contact_labels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          is_business: boolean | null
          is_whatsapp_valid: boolean | null
          last_synced_at: string | null
          name: string | null
          phone_number: string
          profile_picture_url: string | null
          push_name: string | null
          source: string | null
          source_group_id: string | null
          source_group_name: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_business?: boolean | null
          is_whatsapp_valid?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          phone_number: string
          profile_picture_url?: string | null
          push_name?: string | null
          source?: string | null
          source_group_id?: string | null
          source_group_name?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_business?: boolean | null
          is_whatsapp_valid?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          phone_number?: string
          profile_picture_url?: string | null
          push_name?: string | null
          source?: string | null
          source_group_id?: string | null
          source_group_name?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          created_at: string | null
          description: string | null
          extracted_at: string | null
          group_jid: string
          id: string
          is_admin: boolean | null
          is_extracted: boolean | null
          last_synced_at: string | null
          name: string | null
          owner_phone: string | null
          participants_count: number | null
          picture_url: string | null
          store_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          extracted_at?: string | null
          group_jid: string
          id?: string
          is_admin?: boolean | null
          is_extracted?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          owner_phone?: string | null
          participants_count?: number | null
          picture_url?: string | null
          store_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          extracted_at?: string | null
          group_jid?: string
          id?: string
          is_admin?: boolean | null
          is_extracted?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          owner_phone?: string | null
          participants_count?: number | null
          picture_url?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_groups_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_groups_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          instance_name: string
          last_connected_at: string | null
          phone_number: string | null
          profile_name: string | null
          profile_picture_url: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["whatsapp_instance_status"] | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          instance_name: string
          last_connected_at?: string | null
          phone_number?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          qr_code?: string | null
          status?:
            | Database["public"]["Enums"]["whatsapp_instance_status"]
            | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string
          last_connected_at?: string | null
          phone_number?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          qr_code?: string | null
          status?:
            | Database["public"]["Enums"]["whatsapp_instance_status"]
            | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_instances_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          customer_name: string | null
          event_type: string
          id: string
          last_error: string | null
          order_id: string | null
          phone_number: string
          processed_at: string | null
          status: string | null
          store_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          customer_name?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          phone_number: string
          processed_at?: string | null
          status?: string | null
          store_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          customer_name?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          phone_number?: string
          processed_at?: string | null
          status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          campaign_id: string | null
          content: string
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          delivered_at: string | null
          error_message: string | null
          evolution_message_id: string | null
          failed_at: string | null
          id: string
          media_url: string | null
          message_type:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          phone_number: string
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["whatsapp_message_status"] | null
          store_id: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          content: string
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          failed_at?: string | null
          id?: string
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          phone_number: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"] | null
          store_id: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          content?: string
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          failed_at?: string | null
          id?: string
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          phone_number?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"] | null
          store_id?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_paused_contacts: {
        Row: {
          auto_reactivate_at: string | null
          created_at: string | null
          customer_name: string | null
          id: string
          instance_name: string
          paused_at: string
          paused_by: string | null
          reactivated_at: string | null
          remote_jid: string
          status: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          auto_reactivate_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string
          instance_name: string
          paused_at?: string
          paused_by?: string | null
          reactivated_at?: string | null
          remote_jid: string
          status?: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          auto_reactivate_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string
          instance_name?: string
          paused_at?: string
          paused_by?: string | null
          reactivated_at?: string | null
          remote_jid?: string
          status?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_paused_contacts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_paused_contacts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sync_config: {
        Row: {
          auto_sync_enabled: boolean | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          next_sync_at: string | null
          store_id: string
          sync_contacts: boolean | null
          sync_groups: boolean | null
          sync_interval_hours: number | null
          updated_at: string | null
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          store_id: string
          sync_contacts?: boolean | null
          sync_groups?: boolean | null
          sync_interval_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          store_id?: string
          sync_contacts?: boolean | null
          sync_groups?: boolean | null
          sync_interval_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sync_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sync_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          media_caption: string | null
          media_url: string | null
          message_type:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          name: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          media_caption?: string | null
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          name: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          media_caption?: string | null
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          name?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      password_call_config_public: {
        Row: {
          audio_type: string | null
          call_type: string | null
          created_at: string | null
          custom_prefix: string | null
          custom_suffix: string | null
          custom_text_enabled: boolean | null
          custom_text_template: string | null
          elevenlabs_voice_id: string | null
          has_own_api_key: boolean | null
          highlight_duration_ms: number | null
          history_count: number | null
          id: string | null
          is_enabled: boolean | null
          primary_color: string | null
          show_history: boolean | null
          sound_enabled: boolean | null
          store_id: string | null
          store_name_in_call: string | null
          template: string | null
          updated_at: string | null
          use_greeting: boolean | null
          voice_text_template: string | null
        }
        Insert: {
          audio_type?: string | null
          call_type?: string | null
          created_at?: string | null
          custom_prefix?: string | null
          custom_suffix?: string | null
          custom_text_enabled?: boolean | null
          custom_text_template?: string | null
          elevenlabs_voice_id?: string | null
          has_own_api_key?: never
          highlight_duration_ms?: number | null
          history_count?: number | null
          id?: string | null
          is_enabled?: boolean | null
          primary_color?: string | null
          show_history?: boolean | null
          sound_enabled?: boolean | null
          store_id?: string | null
          store_name_in_call?: string | null
          template?: string | null
          updated_at?: string | null
          use_greeting?: boolean | null
          voice_text_template?: string | null
        }
        Update: {
          audio_type?: string | null
          call_type?: string | null
          created_at?: string | null
          custom_prefix?: string | null
          custom_suffix?: string | null
          custom_text_enabled?: boolean | null
          custom_text_template?: string | null
          elevenlabs_voice_id?: string | null
          has_own_api_key?: never
          highlight_duration_ms?: number | null
          history_count?: number | null
          id?: string | null
          is_enabled?: boolean | null
          primary_color?: string | null
          show_history?: boolean | null
          sound_enabled?: boolean | null
          store_id?: string | null
          store_name_in_call?: string | null
          template?: string | null
          updated_at?: string | null
          use_greeting?: boolean | null
          voice_text_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_call_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_call_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      public_store_config: {
        Row: {
          accept_outside_delivery_zone: boolean | null
          created_at: string | null
          custom_scripts: Json | null
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
        Insert: {
          accept_outside_delivery_zone?: boolean | null
          created_at?: string | null
          custom_scripts?: Json | null
          delivery_button_text?: string | null
          delivery_times?: Json | null
          delivery_zones?: Json | null
          pickup_button_text?: string | null
          primary_color?: string | null
          product_display_layout?: string | null
          qr_code_enabled?: boolean | null
          secondary_color?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accept_outside_delivery_zone?: boolean | null
          created_at?: string | null
          custom_scripts?: Json | null
          delivery_button_text?: string | null
          delivery_times?: Json | null
          delivery_zones?: Json | null
          pickup_button_text?: string | null
          primary_color?: string | null
          product_display_layout?: string | null
          qr_code_enabled?: boolean | null
          secondary_color?: string | null
          store_id?: string | null
          updated_at?: string | null
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
      cleanup_old_password_calls: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_product_slug: {
        Args: { input_store_id: string; product_name: string }
        Returns: string
      }
      get_current_user_type: {
        Args: never
        Returns: Database["public"]["Enums"]["user_type"]
      }
      get_next_order_number: { Args: { store_uuid: string }; Returns: string }
      get_password_calls_with_cleanup: {
        Args: { p_limit?: number; p_store_id: string }
        Returns: {
          call_number: string
          call_type: string
          created_at: string
          customer_name: string | null
          id: string
          order_id: string | null
          store_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "password_calls"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      increment_campaign_counter: {
        Args: { p_campaign_id: string; p_counter_name: string }
        Returns: undefined
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
      is_product_variant_from_active_store: {
        Args: { variant_product_id: string }
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
      reset_affiliate_monthly_earnings: { Args: never; Returns: undefined }
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
        | "aguardando_pagamento"
        | "entrada"
        | "em_preparo"
        | "aguarda_retirada"
        | "em_transito"
        | "concluido"
        | "cancelado"
      payment_method: "pix" | "card" | "cash"
      payment_status: "pending" | "paid" | "cancelled"
      payment_type: "fixed" | "commission" | "minimum_guaranteed"
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
      whatsapp_campaign_status:
        | "draft"
        | "scheduled"
        | "running"
        | "paused"
        | "completed"
        | "cancelled"
      whatsapp_instance_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "banned"
      whatsapp_message_status:
        | "pending"
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
      whatsapp_message_type: "text" | "image" | "document" | "audio" | "video"
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
        "aguardando_pagamento",
        "entrada",
        "em_preparo",
        "aguarda_retirada",
        "em_transito",
        "concluido",
        "cancelado",
      ],
      payment_method: ["pix", "card", "cash"],
      payment_status: ["pending", "paid", "cancelled"],
      payment_type: ["fixed", "commission", "minimum_guaranteed"],
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
      whatsapp_campaign_status: [
        "draft",
        "scheduled",
        "running",
        "paused",
        "completed",
        "cancelled",
      ],
      whatsapp_instance_status: [
        "disconnected",
        "connecting",
        "connected",
        "banned",
      ],
      whatsapp_message_status: [
        "pending",
        "queued",
        "sent",
        "delivered",
        "read",
        "failed",
      ],
      whatsapp_message_type: ["text", "image", "document", "audio", "video"],
    },
  },
} as const
