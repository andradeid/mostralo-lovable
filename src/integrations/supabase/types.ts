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
      admin_menu_preferences: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          menu_order: Json
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          menu_order?: Json
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          menu_order?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_menu_preferences_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_menu_preferences_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
        ]
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
      attendant_notifications: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          notification_key: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          notification_key: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          notification_key?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendant_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendant_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      attendant_permissions: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          permission_key: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          permission_key: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          permission_key?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendant_permissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendant_permissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      booking_google_events: {
        Row: {
          booking_id: string
          created_at: string | null
          google_calendar_id: string
          google_event_id: string
          id: string
          last_error: string | null
          store_id: string
          synced_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          google_calendar_id: string
          google_event_id: string
          id?: string
          last_error?: string | null
          store_id: string
          synced_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          google_calendar_id?: string
          google_event_id?: string
          id?: string
          last_error?: string | null
          store_id?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_google_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_google_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_google_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_notification_logs: {
        Row: {
          booking_id: string
          created_at: string | null
          error_message: string | null
          id: string
          notification_type: string
          send_method: string
          sent_at: string
          sent_by: string | null
          status: string
          store_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_type: string
          send_method: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          store_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          send_method?: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notification_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notification_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reviews: {
        Row: {
          booking_id: string
          created_at: string | null
          customer_id: string | null
          expires_at: string | null
          feedback: string | null
          id: string
          is_public: boolean | null
          professional_id: string
          rating: number | null
          reviewed_at: string | null
          store_id: string
          token: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          customer_id?: string | null
          expires_at?: string | null
          feedback?: string | null
          id?: string
          is_public?: boolean | null
          professional_id: string
          rating?: number | null
          reviewed_at?: string | null
          store_id: string
          token: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          customer_id?: string | null
          expires_at?: string | null
          feedback?: string | null
          id?: string
          is_public?: boolean | null
          professional_id?: string
          rating?: number | null
          reviewed_at?: string | null
          store_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          buffer_minutes: number | null
          category_id: string | null
          created_at: string | null
          deposit_amount: number | null
          deposit_percentage: number | null
          description: string | null
          display_order: number | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          price_type: string | null
          requires_deposit: boolean | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          buffer_minutes?: number | null
          category_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_percentage?: number | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          price_type?: string | null
          requires_deposit?: boolean | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          buffer_minutes?: number | null
          category_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_percentage?: number | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          price_type?: string | null
          requires_deposit?: boolean | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_settings: {
        Row: {
          allow_any_professional: boolean | null
          cancellation_hours_limit: number | null
          confirmation_message_template: string | null
          created_at: string | null
          default_deposit_percentage: number | null
          enable_professional_reviews: boolean | null
          id: string
          max_advance_days: number | null
          min_advance_hours: number | null
          reminder_hours_before: number | null
          reminder_message_template: string | null
          require_deposit: boolean | null
          review_delay_minutes: number | null
          review_expiry_days: number | null
          review_message_template: string | null
          satisfaction_message_template: string | null
          send_confirmation_message: boolean | null
          send_reminder_message: boolean | null
          send_satisfaction_survey: boolean | null
          show_public_reviews: boolean | null
          show_subscription_plans: boolean | null
          slot_interval_minutes: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          allow_any_professional?: boolean | null
          cancellation_hours_limit?: number | null
          confirmation_message_template?: string | null
          created_at?: string | null
          default_deposit_percentage?: number | null
          enable_professional_reviews?: boolean | null
          id?: string
          max_advance_days?: number | null
          min_advance_hours?: number | null
          reminder_hours_before?: number | null
          reminder_message_template?: string | null
          require_deposit?: boolean | null
          review_delay_minutes?: number | null
          review_expiry_days?: number | null
          review_message_template?: string | null
          satisfaction_message_template?: string | null
          send_confirmation_message?: boolean | null
          send_reminder_message?: boolean | null
          send_satisfaction_survey?: boolean | null
          show_public_reviews?: boolean | null
          show_subscription_plans?: boolean | null
          slot_interval_minutes?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          allow_any_professional?: boolean | null
          cancellation_hours_limit?: number | null
          confirmation_message_template?: string | null
          created_at?: string | null
          default_deposit_percentage?: number | null
          enable_professional_reviews?: boolean | null
          id?: string
          max_advance_days?: number | null
          min_advance_hours?: number | null
          reminder_hours_before?: number | null
          reminder_message_template?: string | null
          require_deposit?: boolean | null
          review_delay_minutes?: number | null
          review_expiry_days?: number | null
          review_message_template?: string | null
          satisfaction_message_template?: string | null
          send_confirmation_message?: boolean | null
          send_reminder_message?: boolean | null
          send_satisfaction_survey?: boolean | null
          show_public_reviews?: boolean | null
          show_subscription_plans?: boolean | null
          slot_interval_minutes?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          comanda_id: string | null
          confirmation_sent: boolean | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          end_time: string
          id: string
          notes: string | null
          price: number
          professional_id: string
          reminder_sent: boolean | null
          review_sent: boolean | null
          service_id: string
          start_time: string
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          comanda_id?: string | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          price: number
          professional_id: string
          reminder_sent?: boolean | null
          review_sent?: boolean | null
          service_id: string
          start_time: string
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          comanda_id?: string | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          price?: number
          professional_id?: string
          reminder_sent?: boolean | null
          review_sent?: boolean | null
          service_id?: string
          start_time?: string
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          show_in_menu: boolean | null
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
          show_in_menu?: boolean | null
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
          show_in_menu?: boolean | null
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
      category_crosssell_rules: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          max_suggestions: number | null
          priority: number | null
          store_id: string
          suggest_category_id: string
          trigger_category_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          max_suggestions?: number | null
          priority?: number | null
          store_id: string
          suggest_category_id: string
          trigger_category_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          max_suggestions?: number | null
          priority?: number | null
          store_id?: string
          suggest_category_id?: string
          trigger_category_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_crosssell_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_crosssell_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_crosssell_rules_suggest_category_id_fkey"
            columns: ["suggest_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_crosssell_rules_trigger_category_id_fkey"
            columns: ["trigger_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscription_plans: {
        Row: {
          benefits: Json | null
          billing_cycle: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          plan_type: string
          price: number
          store_id: string
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          benefits?: Json | null
          billing_cycle?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          plan_type?: string
          price?: number
          store_id: string
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          benefits?: Json | null
          billing_cycle?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          plan_type?: string
          price?: number
          store_id?: string
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_subscription_plans_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscription_plans_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          auto_renew: boolean
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          current_period_end: string
          current_period_start: string
          customer_id: string
          id: string
          last_payment_date: string | null
          next_payment_date: string | null
          notes: string | null
          pause_reason: string | null
          paused_at: string | null
          payment_amount: number | null
          payment_method: string | null
          plan_id: string
          start_date: string
          status: string
          store_id: string
          updated_at: string
          usages_this_period: number
        }
        Insert: {
          auto_renew?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_end: string
          current_period_start?: string
          customer_id: string
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          plan_id: string
          start_date?: string
          status?: string
          store_id: string
          updated_at?: string
          usages_this_period?: number
        }
        Update: {
          auto_renew?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_end?: string
          current_period_start?: string
          customer_id?: string
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          store_id?: string
          updated_at?: string
          usages_this_period?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "client_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          note_type: string | null
          patient_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          note_type?: string | null
          patient_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          note_type?: string | null
          patient_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_items: {
        Row: {
          added_at: string
          added_by: string | null
          addons: Json | null
          approved_at: string | null
          approved_by: string | null
          comanda_id: string
          id: string
          notes: string | null
          preparation_started_at: string | null
          preparation_status: string | null
          prepared_at: string | null
          product_id: string | null
          product_name: string
          quantity: number
          requires_approval: boolean | null
          total_price: number
          unit_price: number
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          addons?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          comanda_id: string
          id?: string
          notes?: string | null
          preparation_started_at?: string | null
          preparation_status?: string | null
          prepared_at?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          requires_approval?: boolean | null
          total_price: number
          unit_price: number
        }
        Update: {
          added_at?: string
          added_by?: string | null
          addons?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          comanda_id?: string
          id?: string
          notes?: string | null
          preparation_started_at?: string | null
          preparation_status?: string | null
          prepared_at?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          requires_approval?: boolean | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "comanda_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          discount: number
          id: string
          notes: string | null
          number: string
          opened_at: string
          opened_by: string | null
          payment_details: Json | null
          payment_method: string | null
          service_fee: number
          source: string | null
          status: string
          store_id: string
          subtotal: number
          table_number: string | null
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number: string
          opened_at?: string
          opened_by?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          service_fee?: number
          source?: string | null
          status?: string
          store_id: string
          subtotal?: number
          table_number?: string | null
          total?: number
          type?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          opened_at?: string
          opened_by?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          service_fee?: number
          source?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          table_number?: string | null
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comandas_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_proposals: {
        Row: {
          accept_ip_address: string | null
          accept_user_agent: string | null
          accepted_at: string | null
          billing_cycle: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          contract_accepted: boolean | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_monthly_price: number
          id: string
          internal_notes: string | null
          lgpd_accepted: boolean | null
          modules_total: number
          niche_id: string | null
          payment_approval_id: string | null
          payment_method: string | null
          proposal_number: string
          rejected_at: string | null
          rejection_reason: string | null
          salesperson_id: string | null
          selected_modules: Json
          sent_at: string | null
          setup_fee: number | null
          signature_data: Json | null
          slug: string
          status: string | null
          store_count: number | null
          store_id: string | null
          terms_accepted: boolean | null
          updated_at: string | null
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          accept_ip_address?: string | null
          accept_user_agent?: string | null
          accepted_at?: string | null
          billing_cycle?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          contract_accepted?: boolean | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_monthly_price?: number
          id?: string
          internal_notes?: string | null
          lgpd_accepted?: boolean | null
          modules_total?: number
          niche_id?: string | null
          payment_approval_id?: string | null
          payment_method?: string | null
          proposal_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          salesperson_id?: string | null
          selected_modules?: Json
          sent_at?: string | null
          setup_fee?: number | null
          signature_data?: Json | null
          slug: string
          status?: string | null
          store_count?: number | null
          store_id?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          accept_ip_address?: string | null
          accept_user_agent?: string | null
          accepted_at?: string | null
          billing_cycle?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          contract_accepted?: boolean | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_monthly_price?: number
          id?: string
          internal_notes?: string | null
          lgpd_accepted?: boolean | null
          modules_total?: number
          niche_id?: string | null
          payment_approval_id?: string | null
          payment_method?: string | null
          proposal_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          salesperson_id?: string | null
          selected_modules?: Json
          sent_at?: string | null
          setup_fee?: number | null
          signature_data?: Json | null
          slug?: string
          status?: string | null
          store_count?: number | null
          store_id?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_payment_approval_id_fkey"
            columns: ["payment_approval_id"]
            isOneToOne: false
            referencedRelation: "payment_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
      crosssell_statistics: {
        Row: {
          accepted_count: number | null
          created_at: string | null
          id: string
          rejected_count: number | null
          revenue_generated: number | null
          rule_id: string
          shown_count: number | null
          store_id: string
        }
        Insert: {
          accepted_count?: number | null
          created_at?: string | null
          id?: string
          rejected_count?: number | null
          revenue_generated?: number | null
          rule_id: string
          shown_count?: number | null
          store_id: string
        }
        Update: {
          accepted_count?: number | null
          created_at?: string | null
          id?: string
          rejected_count?: number | null
          revenue_generated?: number | null
          rule_id?: string
          shown_count?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crosssell_statistics_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: true
            referencedRelation: "category_crosssell_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crosssell_statistics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crosssell_statistics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
      customer_label_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          customer_id: string
          id: string
          label_id: string
          store_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          customer_id: string
          id?: string
          label_id: string
          store_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          customer_id?: string
          id?: string
          label_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_label_assignments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "customer_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_label_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_label_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_labels: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          label_type: string | null
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          label_type?: string | null
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          label_type?: string | null
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_labels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_labels_store_id_fkey"
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
          password_salt: string | null
          phone: string
          table_password: string | null
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
          password_salt?: string | null
          phone: string
          table_password?: string | null
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
          password_salt?: string | null
          phone?: string
          table_password?: string | null
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
      dental_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          patient_id: string | null
          store_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          patient_id?: string | null
          store_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          patient_id?: string | null
          store_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_audit_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_audit_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_audit_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_consent_records: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          consent_type: string
          created_at: string
          id: string
          ip_address: unknown
          patient_id: string
          revoked_at: string | null
          signature_data: string | null
          store_id: string
          version: string | null
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          patient_id: string
          revoked_at?: string | null
          signature_data?: string | null
          store_id: string
          version?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          patient_id?: string
          revoked_at?: string | null
          signature_data?: string | null
          store_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_consent_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_consent_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_consent_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_document_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          store_id: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          store_id: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          store_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_document_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_document_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_patient_documents: {
        Row: {
          content: string
          created_at: string
          document_number: string | null
          generated_by: string | null
          id: string
          medications: Json | null
          patient_id: string
          patient_signature_data: string | null
          patient_signed_at: string | null
          pdf_url: string | null
          professional_name: string | null
          professional_registration: string | null
          sent_at: string | null
          sent_via: string | null
          signature_data: string | null
          signed_at: string | null
          store_id: string
          template_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          document_number?: string | null
          generated_by?: string | null
          id?: string
          medications?: Json | null
          patient_id: string
          patient_signature_data?: string | null
          patient_signed_at?: string | null
          pdf_url?: string | null
          professional_name?: string | null
          professional_registration?: string | null
          sent_at?: string | null
          sent_via?: string | null
          signature_data?: string | null
          signed_at?: string | null
          store_id: string
          template_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          document_number?: string | null
          generated_by?: string | null
          id?: string
          medications?: Json | null
          patient_id?: string
          patient_signature_data?: string | null
          patient_signed_at?: string | null
          pdf_url?: string | null
          professional_name?: string | null
          professional_registration?: string | null
          sent_at?: string | null
          sent_via?: string | null
          signature_data?: string | null
          signed_at?: string | null
          store_id?: string
          template_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_patient_documents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_patient_documents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_patient_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "dental_document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_payments: {
        Row: {
          amount: number
          attachment_url: string | null
          created_at: string
          id: string
          installment_number: number | null
          notes: string | null
          patient_id: string
          payment_date: string
          payment_method: string
          quote_id: string
          reference_number: string | null
          registered_by: string | null
          store_id: string
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          created_at?: string
          id?: string
          installment_number?: number | null
          notes?: string | null
          patient_id: string
          payment_date?: string
          payment_method: string
          quote_id: string
          reference_number?: string | null
          registered_by?: string | null
          store_id: string
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          created_at?: string
          id?: string
          installment_number?: number | null
          notes?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string
          quote_id?: string
          reference_number?: string | null
          registered_by?: string | null
          store_id?: string
          total_installments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "dental_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_procedures: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          default_price: number
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_procedures_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_procedures_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_quote_items: {
        Row: {
          created_at: string
          description: string
          discount_percentage: number | null
          id: string
          notes: string | null
          procedure_code: string | null
          procedure_id: string | null
          quantity: number
          quote_id: string
          sort_order: number | null
          tooth_number: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          procedure_code?: string | null
          procedure_id?: string | null
          quantity?: number
          quote_id: string
          sort_order?: number | null
          tooth_number?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          procedure_code?: string | null
          procedure_id?: string | null
          quantity?: number
          quote_id?: string
          sort_order?: number | null
          tooth_number?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "dental_quote_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "dental_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "dental_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_quotes: {
        Row: {
          approved_at: string | null
          created_at: string
          created_by: string | null
          discount_percentage: number | null
          discount_value: number | null
          id: string
          installments: number | null
          internal_notes: string | null
          notes: string | null
          patient_id: string
          payment_conditions: string | null
          quote_number: string
          rejected_at: string | null
          rejection_reason: string | null
          sent_at: string | null
          sent_via: string | null
          signature_data: string | null
          signed_at: string | null
          status: string
          store_id: string
          subtotal: number
          total_value: number
          treatment_plan_id: string | null
          updated_at: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          id?: string
          installments?: number | null
          internal_notes?: string | null
          notes?: string | null
          patient_id: string
          payment_conditions?: string | null
          quote_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          sent_via?: string | null
          signature_data?: string | null
          signed_at?: string | null
          status?: string
          store_id: string
          subtotal: number
          total_value: number
          treatment_plan_id?: string | null
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          id?: string
          installments?: number | null
          internal_notes?: string | null
          notes?: string | null
          patient_id?: string
          payment_conditions?: string | null
          quote_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          sent_via?: string | null
          signature_data?: string | null
          signed_at?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          total_value?: number
          treatment_plan_id?: string | null
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_quotes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_quotes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_quotes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_quotes_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_card_clicks: {
        Row: {
          card_id: string
          click_type: string
          created_at: string | null
          id: string
          ip_hash: string | null
          link_label: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          card_id: string
          click_type: string
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          link_label?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          card_id?: string
          click_type?: string
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          link_label?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_card_clicks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "digital_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_cards: {
        Row: {
          accent_color: string | null
          bio: string | null
          booking_button_text: string | null
          booking_enabled: boolean | null
          company: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          custom_links: Json | null
          email: string | null
          facebook: string | null
          headline: string | null
          id: string
          inherit_store_data: boolean | null
          instagram: string | null
          is_active: boolean | null
          linkedin: string | null
          name: string
          owner_id: string
          owner_type: string
          phone: string | null
          photo_url: string | null
          professional_id: string | null
          referral_code: string | null
          show_mostralo_badge: boolean | null
          show_qr_code: boolean | null
          slug: string
          stats_text: string | null
          store_id: string | null
          theme: string | null
          tiktok: string | null
          title: string | null
          updated_at: string | null
          views_count: number | null
          website: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          accent_color?: string | null
          bio?: string | null
          booking_button_text?: string | null
          booking_enabled?: boolean | null
          company?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          custom_links?: Json | null
          email?: string | null
          facebook?: string | null
          headline?: string | null
          id?: string
          inherit_store_data?: boolean | null
          instagram?: string | null
          is_active?: boolean | null
          linkedin?: string | null
          name: string
          owner_id: string
          owner_type?: string
          phone?: string | null
          photo_url?: string | null
          professional_id?: string | null
          referral_code?: string | null
          show_mostralo_badge?: boolean | null
          show_qr_code?: boolean | null
          slug: string
          stats_text?: string | null
          store_id?: string | null
          theme?: string | null
          tiktok?: string | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          accent_color?: string | null
          bio?: string | null
          booking_button_text?: string | null
          booking_enabled?: boolean | null
          company?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          custom_links?: Json | null
          email?: string | null
          facebook?: string | null
          headline?: string | null
          id?: string
          inherit_store_data?: boolean | null
          instagram?: string | null
          is_active?: boolean | null
          linkedin?: string | null
          name?: string
          owner_id?: string
          owner_type?: string
          phone?: string | null
          photo_url?: string | null
          professional_id?: string | null
          referral_code?: string | null
          show_mostralo_badge?: boolean | null
          show_qr_code?: boolean | null
          slug?: string
          stats_text?: string | null
          store_id?: string | null
          theme?: string | null
          tiktok?: string | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_cards_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_cards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_cards_store_id_fkey"
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
          auto_send_invoices: boolean | null
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
          auto_send_invoices?: boolean | null
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
          auto_send_invoices?: boolean | null
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
          auto_send_whatsapp: boolean | null
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
          auto_send_whatsapp?: boolean | null
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
          auto_send_whatsapp?: boolean | null
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
          booking_id: string | null
          category_id: string
          comanda_id: string | null
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
          booking_id?: string | null
          category_id: string
          comanda_id?: string | null
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
          booking_id?: string | null
          category_id?: string
          comanda_id?: string | null
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
            foreignKeyName: "financial_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
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
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          calendar_name: string | null
          created_at: string | null
          google_email: string | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_sync_at: string | null
          professional_id: string
          refresh_token: string
          store_id: string
          sync_enabled: boolean | null
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string | null
          google_email?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          professional_id: string
          refresh_token: string
          store_id: string
          sync_enabled?: boolean | null
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string | null
          google_email?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          professional_id?: string
          refresh_token?: string
          store_id?: string
          sync_enabled?: boolean | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_tokens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_tokens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_config: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
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
      image_search_config: {
        Row: {
          api_key: string
          created_at: string | null
          daily_limit: number | null
          id: string
          is_active: boolean | null
          last_reset_date: string | null
          provider: string
          search_engine_id: string | null
          searches_today: number | null
          serpapi_key: string | null
          updated_at: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_reset_date?: string | null
          provider?: string
          search_engine_id?: string | null
          searches_today?: number | null
          serpapi_key?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_reset_date?: string | null
          provider?: string
          search_engine_id?: string | null
          searches_today?: number | null
          serpapi_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          diagnostic_answers: Json | null
          email: string
          id: string
          ip_address: string | null
          landing_page: string | null
          last_follow_up_reminder_at: string | null
          monthly_revenue: string | null
          name: string
          notes: string | null
          phone: string
          qualification_level: string | null
          qualification_score: number | null
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
          diagnostic_answers?: Json | null
          email: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          last_follow_up_reminder_at?: string | null
          monthly_revenue?: string | null
          name: string
          notes?: string | null
          phone: string
          qualification_level?: string | null
          qualification_score?: number | null
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
          diagnostic_answers?: Json | null
          email?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          last_follow_up_reminder_at?: string | null
          monthly_revenue?: string | null
          name?: string
          notes?: string | null
          phone?: string
          qualification_level?: string | null
          qualification_score?: number | null
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
      master_faq: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          metadata: Json | null
          priority: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          metadata?: Json | null
          priority?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          metadata?: Json | null
          priority?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      master_recruitment_keywords: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
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
          recruitment_openai_assistant_id: string | null
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
          sales_openai_assistant_id: string | null
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
          support_openai_assistant_id: string | null
          unified_openai_assistant_id: string | null
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
          recruitment_openai_assistant_id?: string | null
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
          sales_openai_assistant_id?: string | null
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
          support_openai_assistant_id?: string | null
          unified_openai_assistant_id?: string | null
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
          recruitment_openai_assistant_id?: string | null
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
          sales_openai_assistant_id?: string | null
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
          support_openai_assistant_id?: string | null
          unified_openai_assistant_id?: string | null
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
          dependencies: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          key: string | null
          name: string
          price_reference: string | null
          suggested_price: number | null
        }
        Insert: {
          created_at?: string
          dependencies?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          name: string
          price_reference?: string | null
          suggested_price?: number | null
        }
        Update: {
          created_at?: string
          dependencies?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          name?: string
          price_reference?: string | null
          suggested_price?: number | null
        }
        Relationships: []
      }
      niche_module_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          module_ids: string[]
          name: string
          niche_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          module_ids?: string[]
          name: string
          niche_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          module_ids?: string[]
          name?: string
          niche_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_module_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niche_module_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niche_module_templates_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      openai_usage_logs: {
        Row: {
          completion_tokens: number
          created_at: string | null
          estimated_cost_cents: number
          id: string
          message_type: string | null
          metadata: Json | null
          model: string
          prompt_tokens: number
          store_id: string
          total_tokens: number | null
          usage_type: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string | null
          estimated_cost_cents?: number
          id?: string
          message_type?: string | null
          metadata?: Json | null
          model: string
          prompt_tokens?: number
          store_id: string
          total_tokens?: number | null
          usage_type?: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string | null
          estimated_cost_cents?: number
          id?: string
          message_type?: string | null
          metadata?: Json | null
          model?: string
          prompt_tokens?: number
          store_id?: string
          total_tokens?: number | null
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "openai_usage_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openai_usage_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
          preparation_started_at: string | null
          preparation_status: string | null
          prepared_at: string | null
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
          preparation_started_at?: string | null
          preparation_status?: string | null
          prepared_at?: string | null
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
          preparation_started_at?: string | null
          preparation_status?: string | null
          prepared_at?: string | null
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
      patient_records: {
        Row: {
          alcohol_consumption: string | null
          allergies: string | null
          allergy_anesthesia: boolean | null
          allergy_latex: boolean | null
          allergy_penicillin: boolean | null
          blood_type: string | null
          bruxism: boolean | null
          clinical_observations: string | null
          created_at: string
          current_medications: string | null
          has_bleeding_disorder: boolean | null
          has_diabetes: boolean | null
          has_heart_condition: boolean | null
          has_hepatitis: boolean | null
          has_hiv: boolean | null
          has_hypertension: boolean | null
          has_pacemaker: boolean | null
          height: number | null
          id: string
          is_breastfeeding: boolean | null
          is_pregnant: boolean | null
          is_smoker: boolean | null
          last_updated_by: string | null
          medical_conditions: string | null
          patient_id: string
          previous_surgeries: string | null
          smoking_frequency: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          alcohol_consumption?: string | null
          allergies?: string | null
          allergy_anesthesia?: boolean | null
          allergy_latex?: boolean | null
          allergy_penicillin?: boolean | null
          blood_type?: string | null
          bruxism?: boolean | null
          clinical_observations?: string | null
          created_at?: string
          current_medications?: string | null
          has_bleeding_disorder?: boolean | null
          has_diabetes?: boolean | null
          has_heart_condition?: boolean | null
          has_hepatitis?: boolean | null
          has_hiv?: boolean | null
          has_hypertension?: boolean | null
          has_pacemaker?: boolean | null
          height?: number | null
          id?: string
          is_breastfeeding?: boolean | null
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          last_updated_by?: string | null
          medical_conditions?: string | null
          patient_id: string
          previous_surgeries?: string | null
          smoking_frequency?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          alcohol_consumption?: string | null
          allergies?: string | null
          allergy_anesthesia?: boolean | null
          allergy_latex?: boolean | null
          allergy_penicillin?: boolean | null
          blood_type?: string | null
          bruxism?: boolean | null
          clinical_observations?: string | null
          created_at?: string
          current_medications?: string | null
          has_bleeding_disorder?: boolean | null
          has_diabetes?: boolean | null
          has_heart_condition?: boolean | null
          has_hepatitis?: boolean | null
          has_hiv?: boolean | null
          has_hypertension?: boolean | null
          has_pacemaker?: boolean | null
          height?: number | null
          id?: string
          is_breastfeeding?: boolean | null
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          last_updated_by?: string | null
          medical_conditions?: string | null
          patient_id?: string
          previous_surgeries?: string | null
          smoking_frequency?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          gender: string | null
          health_insurance: string | null
          health_insurance_number: string | null
          health_insurance_validity: string | null
          id: string
          is_active: boolean
          marital_status: string | null
          name: string
          notes: string | null
          occupation: string | null
          phone: string | null
          phone_secondary: string | null
          photo_url: string | null
          referred_by: string | null
          rg: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gender?: string | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          health_insurance_validity?: string | null
          id?: string
          is_active?: boolean
          marital_status?: string | null
          name: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          referred_by?: string | null
          rg?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gender?: string | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          health_insurance_validity?: string | null
          id?: string
          is_active?: boolean
          marital_status?: string | null
          name?: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          referred_by?: string | null
          rg?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_store_id_fkey"
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
          proposal_id: string | null
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
          proposal_id?: string | null
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
          proposal_id?: string | null
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
            foreignKeyName: "payment_approvals_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposals"
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
      periodontal_records: {
        Row: {
          bleeding: boolean
          created_at: string
          gingival_recession: number
          id: string
          patient_id: string
          pocket_depth: number
          position: string
          registered_by: string | null
          store_id: string
          tooth_number: number
          updated_at: string
        }
        Insert: {
          bleeding?: boolean
          created_at?: string
          gingival_recession?: number
          id?: string
          patient_id: string
          pocket_depth?: number
          position: string
          registered_by?: string | null
          store_id: string
          tooth_number: number
          updated_at?: string
        }
        Update: {
          bleeding?: boolean
          created_at?: string
          gingival_recession?: number
          id?: string
          patient_id?: string
          pocket_depth?: number
          position?: string
          registered_by?: string | null
          store_id?: string
          tooth_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodontal_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodontal_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodontal_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_included_services: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          service_id: string
          usage_limit_per_service: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          service_id: string
          usage_limit_per_service?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          service_id?: string
          usage_limit_per_service?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_included_services_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "client_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_included_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
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
      popup_analytics: {
        Row: {
          action: string
          created_at: string | null
          device_type: string | null
          id: string
          page_url: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variation: string
        }
        Insert: {
          action: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variation: string
        }
        Update: {
          action?: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variation?: string
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
      product_import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_count: number
          errors: Json | null
          file_name: string
          id: string
          imported_by: string
          status: string
          store_id: string
          success_count: number
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_count?: number
          errors?: Json | null
          file_name: string
          id?: string
          imported_by: string
          status?: string
          store_id: string
          success_count?: number
          total_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_count?: number
          errors?: Json | null
          file_name?: string
          id?: string
          imported_by?: string
          status?: string
          store_id?: string
          success_count?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_import_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_import_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_upsells: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          product_id: string
          store_id: string
          updated_at: string | null
          upsell_price: number | null
          upsell_product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          product_id: string
          store_id: string
          updated_at?: string | null
          upsell_price?: number | null
          upsell_product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          product_id?: string
          store_id?: string
          updated_at?: string | null
          upsell_price?: number | null
          upsell_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_upsells_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_upsells_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_upsells_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_upsells_upsell_product_id_fkey"
            columns: ["upsell_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          stock_quantity: number | null
          track_stock: boolean | null
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
          stock_quantity?: number | null
          track_stock?: boolean | null
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
          stock_quantity?: number | null
          track_stock?: boolean | null
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
          is_featured: boolean | null
          is_on_offer: boolean | null
          name: string
          offer_price: number | null
          original_price: number | null
          price: number
          recurrence_days: number | null
          show_in_menu: boolean | null
          slug: string | null
          stock_alert_threshold: number | null
          stock_quantity: number | null
          store_id: string | null
          track_stock: boolean | null
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
          is_featured?: boolean | null
          is_on_offer?: boolean | null
          name: string
          offer_price?: number | null
          original_price?: number | null
          price: number
          recurrence_days?: number | null
          show_in_menu?: boolean | null
          slug?: string | null
          stock_alert_threshold?: number | null
          stock_quantity?: number | null
          store_id?: string | null
          track_stock?: boolean | null
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
          is_featured?: boolean | null
          is_on_offer?: boolean | null
          name?: string
          offer_price?: number | null
          original_price?: number | null
          price?: number
          recurrence_days?: number | null
          show_in_menu?: boolean | null
          slug?: string | null
          stock_alert_threshold?: number | null
          stock_quantity?: number | null
          store_id?: string | null
          track_stock?: boolean | null
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
      professional_blocks: {
        Row: {
          block_date: string
          created_at: string | null
          end_time: string | null
          id: string
          is_all_day: boolean | null
          professional_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          block_date: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_all_day?: boolean | null
          professional_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          block_date?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_all_day?: boolean | null
          professional_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_commissions: {
        Row: {
          booking_id: string
          commission_amount: number
          commission_type: string
          commission_value: number
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_receipt_url: string | null
          payment_reference: string | null
          professional_id: string
          service_price: number
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          commission_amount?: number
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          professional_id: string
          service_price: number
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          commission_amount?: number
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          professional_id?: string
          service_price?: number
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          professional_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          professional_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          professional_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          created_at: string | null
          custom_duration: number | null
          custom_price: number | null
          id: string
          is_active: boolean | null
          professional_id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          custom_duration?: number | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          professional_id: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          custom_duration?: number | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          commission_type: string | null
          commission_value: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          slug: string | null
          specialty: string | null
          store_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          slug?: string | null
          specialty?: string | null
          store_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          slug?: string | null
          specialty?: string | null
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_store_id_fkey"
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
          whatsapp_valid: boolean | null
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
          whatsapp_valid?: boolean | null
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
          whatsapp_valid?: boolean | null
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
      proposal_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          proposal_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          proposal_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          proposal_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_activity_log_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposals"
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
      recurring_invoice_logs: {
        Row: {
          created_at: string
          errors_count: number
          executed_at: string
          execution_details: Json | null
          execution_source: string
          id: string
          invoices_created: number
          total_processed: number
          whatsapp_sent: number
        }
        Insert: {
          created_at?: string
          errors_count?: number
          executed_at?: string
          execution_details?: Json | null
          execution_source?: string
          id?: string
          invoices_created?: number
          total_processed?: number
          whatsapp_sent?: number
        }
        Update: {
          created_at?: string
          errors_count?: number
          executed_at?: string
          execution_details?: Json | null
          execution_source?: string
          id?: string
          invoices_created?: number
          total_processed?: number
          whatsapp_sent?: number
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
      sentinela_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          result: Json | null
          store_id: string
          triggered_by: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          result?: Json | null
          store_id: string
          triggered_by?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          result?: Json | null
          store_id?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentinela_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinela_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sentinela_reminders: {
        Row: {
          conversion_order_id: string | null
          converted_at: string | null
          converted_order_id: string | null
          converted_order_value: number | null
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
          converted_order_id?: string | null
          converted_order_value?: number | null
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
          converted_order_id?: string | null
          converted_order_value?: number | null
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
            foreignKeyName: "sentinela_reminders_converted_order_id_fkey"
            columns: ["converted_order_id"]
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
          image_url: string | null
          is_active: boolean | null
          message_template: string | null
          product_id: string | null
          recurrence_days: number
          reminder_days_before: number
          store_id: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message_template?: string | null
          product_id?: string | null
          recurrence_days?: number
          reminder_days_before?: number
          store_id: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message_template?: string | null
          product_id?: string | null
          recurrence_days?: number
          reminder_days_before?: number
          store_id?: string
          template_id?: string | null
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
          {
            foreignKeyName: "sentinela_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sentinela_templates"
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      short_links: {
        Row: {
          address: string | null
          clicks: number | null
          created_at: string
          id: string
          lat: number
          lng: number
          store_slug: string
        }
        Insert: {
          address?: string | null
          clicks?: number | null
          created_at?: string
          id: string
          lat: number
          lng: number
          store_slug: string
        }
        Update: {
          address?: string | null
          clicks?: number | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          store_slug?: string
        }
        Relationships: []
      }
      store_bot_config: {
        Row: {
          auto_reactivate_minutes: number | null
          bot_mode: string | null
          bot_name: string | null
          bot_split_messages: boolean | null
          bot_time_per_char: number | null
          created_at: string | null
          custom_greeting: string | null
          custom_prompt_instructions: string | null
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
          last_sync_error: string | null
          last_synced_at: string | null
          listening_from_me: boolean | null
          needs_sync: boolean | null
          openai_assistant_id: string | null
          openai_creds_id: string | null
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
          bot_mode?: string | null
          bot_name?: string | null
          bot_split_messages?: boolean | null
          bot_time_per_char?: number | null
          created_at?: string | null
          custom_greeting?: string | null
          custom_prompt_instructions?: string | null
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
          last_sync_error?: string | null
          last_synced_at?: string | null
          listening_from_me?: boolean | null
          needs_sync?: boolean | null
          openai_assistant_id?: string | null
          openai_creds_id?: string | null
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
          bot_mode?: string | null
          bot_name?: string | null
          bot_split_messages?: boolean | null
          bot_time_per_char?: number | null
          created_at?: string | null
          custom_greeting?: string | null
          custom_prompt_instructions?: string | null
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
          last_sync_error?: string | null
          last_synced_at?: string | null
          listening_from_me?: boolean | null
          needs_sync?: boolean | null
          openai_assistant_id?: string | null
          openai_creds_id?: string | null
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
      store_sales_channels: {
        Row: {
          booking_enabled: boolean | null
          created_at: string | null
          delivery_enabled: boolean | null
          id: string
          ifood_enabled: boolean | null
          mesa_enabled: boolean | null
          pdv_enabled: boolean | null
          store_id: string
          totem_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          booking_enabled?: boolean | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          id?: string
          ifood_enabled?: boolean | null
          mesa_enabled?: boolean | null
          pdv_enabled?: boolean | null
          store_id: string
          totem_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          booking_enabled?: boolean | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          id?: string
          ifood_enabled?: boolean | null
          mesa_enabled?: boolean | null
          pdv_enabled?: boolean | null
          store_id?: string
          totem_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_sales_channels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_sales_channels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
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
      store_table_service_config: {
        Row: {
          allow_direct_payment: boolean | null
          created_at: string | null
          customer_password_required: boolean | null
          id: string
          max_comandas_per_table: number | null
          require_waiter_approval: boolean | null
          store_id: string
          table_count: number | null
          updated_at: string | null
        }
        Insert: {
          allow_direct_payment?: boolean | null
          created_at?: string | null
          customer_password_required?: boolean | null
          id?: string
          max_comandas_per_table?: number | null
          require_waiter_approval?: boolean | null
          store_id: string
          table_count?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_direct_payment?: boolean | null
          created_at?: string | null
          customer_password_required?: boolean | null
          id?: string
          max_comandas_per_table?: number | null
          require_waiter_approval?: boolean | null
          store_id?: string
          table_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_table_service_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_table_service_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_totem_config: {
        Row: {
          allow_customer_identification: boolean | null
          auto_print_receipt: boolean | null
          background_color: string | null
          cart_position: string | null
          categories_position: string | null
          created_at: string | null
          dark_mode: boolean | null
          id: string
          identification_fields: string[] | null
          identification_type: string | null
          inactivity_timeout_seconds: number | null
          inactivity_warning_seconds: number | null
          is_enabled: boolean | null
          logo_size: string | null
          orientation: string | null
          password_display_duration_seconds: number | null
          payment_methods: string[] | null
          pix_timeout_seconds: number | null
          product_card_size: string | null
          show_item_notes: boolean | null
          show_logo: boolean | null
          show_order_summary_on_confirmation: boolean | null
          show_product_description: boolean | null
          show_product_images: boolean | null
          show_welcome_image: boolean | null
          store_id: string
          theme_color: string | null
          updated_at: string | null
          welcome_image_url: string | null
          welcome_subtitle: string | null
          welcome_title: string | null
        }
        Insert: {
          allow_customer_identification?: boolean | null
          auto_print_receipt?: boolean | null
          background_color?: string | null
          cart_position?: string | null
          categories_position?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          id?: string
          identification_fields?: string[] | null
          identification_type?: string | null
          inactivity_timeout_seconds?: number | null
          inactivity_warning_seconds?: number | null
          is_enabled?: boolean | null
          logo_size?: string | null
          orientation?: string | null
          password_display_duration_seconds?: number | null
          payment_methods?: string[] | null
          pix_timeout_seconds?: number | null
          product_card_size?: string | null
          show_item_notes?: boolean | null
          show_logo?: boolean | null
          show_order_summary_on_confirmation?: boolean | null
          show_product_description?: boolean | null
          show_product_images?: boolean | null
          show_welcome_image?: boolean | null
          store_id: string
          theme_color?: string | null
          updated_at?: string | null
          welcome_image_url?: string | null
          welcome_subtitle?: string | null
          welcome_title?: string | null
        }
        Update: {
          allow_customer_identification?: boolean | null
          auto_print_receipt?: boolean | null
          background_color?: string | null
          cart_position?: string | null
          categories_position?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          id?: string
          identification_fields?: string[] | null
          identification_type?: string | null
          inactivity_timeout_seconds?: number | null
          inactivity_warning_seconds?: number | null
          is_enabled?: boolean | null
          logo_size?: string | null
          orientation?: string | null
          password_display_duration_seconds?: number | null
          payment_methods?: string[] | null
          pix_timeout_seconds?: number | null
          product_card_size?: string | null
          show_item_notes?: boolean | null
          show_logo?: boolean | null
          show_order_summary_on_confirmation?: boolean | null
          show_product_description?: boolean | null
          show_product_images?: boolean | null
          show_welcome_image?: boolean | null
          store_id?: string
          theme_color?: string | null
          updated_at?: string | null
          welcome_image_url?: string | null
          welcome_subtitle?: string | null
          welcome_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_totem_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_totem_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
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
          sentinela_interval_seconds: number | null
          sentinela_pause_after_messages: number | null
          sentinela_pause_duration_seconds: number | null
          sentinela_pause_end: string | null
          sentinela_pause_reason: string | null
          sentinela_pause_start: string | null
          sentinela_paused: boolean | null
          sentinela_send_days: string[] | null
          sentinela_send_hour: number | null
          sentinela_timezone: string | null
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
          sentinela_interval_seconds?: number | null
          sentinela_pause_after_messages?: number | null
          sentinela_pause_duration_seconds?: number | null
          sentinela_pause_end?: string | null
          sentinela_pause_reason?: string | null
          sentinela_pause_start?: string | null
          sentinela_paused?: boolean | null
          sentinela_send_days?: string[] | null
          sentinela_send_hour?: number | null
          sentinela_timezone?: string | null
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
          sentinela_interval_seconds?: number | null
          sentinela_pause_after_messages?: number | null
          sentinela_pause_duration_seconds?: number | null
          sentinela_pause_end?: string | null
          sentinela_pause_reason?: string | null
          sentinela_pause_start?: string | null
          sentinela_paused?: boolean | null
          sentinela_send_days?: string[] | null
          sentinela_send_hour?: number | null
          sentinela_timezone?: string | null
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
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string
          period_end: string
          period_start: string
          pix_copia_cola: string | null
          pix_expires_at: string | null
          pix_qrcode_base64: string | null
          pix_txid: string | null
          status: string
          store_id: string
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method: string
          period_end: string
          period_start: string
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
          status?: string
          store_id: string
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          period_end?: string
          period_start?: string
          pix_copia_cola?: string | null
          pix_expires_at?: string | null
          pix_qrcode_base64?: string | null
          pix_txid?: string | null
          status?: string
          store_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usages: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          notes: string | null
          service_id: string
          subscription_id: string
          used_at: string
          used_by_professional_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          subscription_id: string
          used_at?: string
          used_by_professional_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          subscription_id?: string
          used_at?: string
          used_by_professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usages_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usages_used_by_professional_id_fkey"
            columns: ["used_by_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
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
      system_financial_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_financial_transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_auto: boolean
          is_recurring: boolean
          notes: string | null
          payment_method: string | null
          recurrence_type: string | null
          reference_number: string | null
          source_id: string | null
          source_paid_at: string | null
          source_type: string | null
          transaction_date: string
          type: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_auto?: boolean
          is_recurring?: boolean
          notes?: string | null
          payment_method?: string | null
          recurrence_type?: string | null
          reference_number?: string | null
          source_id?: string | null
          source_paid_at?: string | null
          source_type?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_auto?: boolean
          is_recurring?: boolean
          notes?: string | null
          payment_method?: string | null
          recurrence_type?: string | null
          reference_number?: string | null
          source_id?: string | null
          source_paid_at?: string | null
          source_type?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "system_financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_users_view"
            referencedColumns: ["id"]
          },
        ]
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
      tooth_records: {
        Row: {
          color: string | null
          condition: string
          created_at: string
          face: string | null
          id: string
          material: string | null
          notes: string | null
          patient_id: string
          registered_by: string | null
          store_id: string
          tooth_number: number
          treatment_done: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          condition: string
          created_at?: string
          face?: string | null
          id?: string
          material?: string | null
          notes?: string | null
          patient_id: string
          registered_by?: string | null
          store_id: string
          tooth_number: number
          treatment_done?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          condition?: string
          created_at?: string
          face?: string | null
          id?: string
          material?: string | null
          notes?: string | null
          patient_id?: string
          registered_by?: string | null
          store_id?: string
          tooth_number?: number
          treatment_done?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tooth_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tooth_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tooth_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plan_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          discount_percentage: number | null
          face: string | null
          id: string
          notes: string | null
          plan_id: string
          priority: number | null
          procedure_code: string | null
          procedure_id: string | null
          procedure_name: string
          quantity: number
          scheduled_date: string | null
          status: string
          tooth_number: number | null
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          discount_percentage?: number | null
          face?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          priority?: number | null
          procedure_code?: string | null
          procedure_id?: string | null
          procedure_name: string
          quantity?: number
          scheduled_date?: string | null
          status?: string
          tooth_number?: number | null
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          discount_percentage?: number | null
          face?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          priority?: number | null
          procedure_code?: string | null
          procedure_id?: string | null
          procedure_name?: string
          quantity?: number
          scheduled_date?: string | null
          status?: string
          tooth_number?: number | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "dental_procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_percentage: number | null
          discount_value: number | null
          final_value: number
          id: string
          name: string
          notes: string | null
          patient_id: string
          plan_number: string | null
          started_at: string | null
          status: string
          store_id: string
          total_value: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          final_value?: number
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          plan_number?: string | null
          started_at?: string | null
          status?: string
          store_id: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          final_value?: number
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          plan_number?: string | null
          started_at?: string | null
          status?: string
          store_id?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_categories: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          featured_video_url: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured_video_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured_video_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tutorial_category_subscriptions: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          notify_in_app: boolean | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          notify_in_app?: boolean | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          notify_in_app?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_category_subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tutorial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_favorites: {
        Row: {
          created_at: string | null
          id: string
          tutorial_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tutorial_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tutorial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_favorites_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_notifications: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          tutorial_id: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          tutorial_id: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          tutorial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_notifications_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tutorial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_notifications_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_views: {
        Row: {
          completed: boolean | null
          id: string
          store_id: string | null
          tutorial_id: string
          updated_at: string | null
          user_id: string
          viewed_at: string | null
          watch_time_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          store_id?: string | null
          tutorial_id: string
          updated_at?: string | null
          user_id: string
          viewed_at?: string | null
          watch_time_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          store_id?: string | null
          tutorial_id?: string
          updated_at?: string | null
          user_id?: string
          viewed_at?: string | null
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_views_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_views_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_views_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          youtube_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          youtube_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tutorial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_statistics: {
        Row: {
          accepted_count: number | null
          created_at: string | null
          id: string
          product_upsell_id: string
          rejected_count: number | null
          revenue_generated: number | null
          shown_count: number | null
          store_id: string
        }
        Insert: {
          accepted_count?: number | null
          created_at?: string | null
          id?: string
          product_upsell_id: string
          rejected_count?: number | null
          revenue_generated?: number | null
          shown_count?: number | null
          store_id: string
        }
        Update: {
          accepted_count?: number | null
          created_at?: string | null
          id?: string
          product_upsell_id?: string
          rejected_count?: number | null
          revenue_generated?: number | null
          shown_count?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_statistics_product_upsell_id_fkey"
            columns: ["product_upsell_id"]
            isOneToOne: true
            referencedRelation: "product_upsells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_statistics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_statistics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
          button_1_text: string | null
          button_1_url: string | null
          button_2_text: string | null
          button_2_url: string | null
          button_3_text: string | null
          button_3_url: string | null
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
          interaction_type: string | null
          list_button_text: string | null
          list_sections: Json | null
          list_title: string | null
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
          poll_options: string[] | null
          poll_question: string | null
          poll_selectable_count: number | null
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
          button_1_text?: string | null
          button_1_url?: string | null
          button_2_text?: string | null
          button_2_url?: string | null
          button_3_text?: string | null
          button_3_url?: string | null
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
          interaction_type?: string | null
          list_button_text?: string | null
          list_sections?: Json | null
          list_title?: string | null
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
          poll_options?: string[] | null
          poll_question?: string | null
          poll_selectable_count?: number | null
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
          button_1_text?: string | null
          button_1_url?: string | null
          button_2_text?: string | null
          button_2_url?: string | null
          button_3_text?: string | null
          button_3_url?: string | null
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
          interaction_type?: string | null
          list_button_text?: string | null
          list_sections?: Json | null
          list_title?: string | null
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
          poll_options?: string[] | null
          poll_question?: string | null
          poll_selectable_count?: number | null
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
          buttons: Json | null
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
          interaction_type: string | null
          list_button_text: string | null
          list_sections: Json | null
          list_title: string | null
          media_url: string | null
          message_type:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          phone_number: string
          poll_options: string[] | null
          poll_question: string | null
          poll_selectable_count: number | null
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["whatsapp_message_status"] | null
          store_id: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          buttons?: Json | null
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
          interaction_type?: string | null
          list_button_text?: string | null
          list_sections?: Json | null
          list_title?: string | null
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          phone_number: string
          poll_options?: string[] | null
          poll_question?: string | null
          poll_selectable_count?: number | null
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"] | null
          store_id: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          buttons?: Json | null
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
          interaction_type?: string | null
          list_button_text?: string | null
          list_sections?: Json | null
          list_title?: string | null
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          phone_number?: string
          poll_options?: string[] | null
          poll_question?: string | null
          poll_selectable_count?: number | null
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
      whatsapp_session_context: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          phone_number: string | null
          push_name: string | null
          remote_jid: string
          store_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          phone_number?: string | null
          push_name?: string | null
          remote_jid: string
          store_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          phone_number?: string | null
          push_name?: string | null
          remote_jid?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_session_context_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_session_context_store_id_fkey"
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
          list_button_text: string | null
          list_sections: Json | null
          list_title: string | null
          media_caption: string | null
          media_url: string | null
          message_type:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          name: string
          poll_options: Json | null
          poll_question: string | null
          poll_selectable_count: number | null
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
          list_button_text?: string | null
          list_sections?: Json | null
          list_title?: string | null
          media_caption?: string | null
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          name: string
          poll_options?: Json | null
          poll_question?: string | null
          poll_selectable_count?: number | null
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
          list_button_text?: string | null
          list_sections?: Json | null
          list_title?: string | null
          media_caption?: string | null
          media_url?: string | null
          message_type?:
            | Database["public"]["Enums"]["whatsapp_message_type"]
            | null
          name?: string
          poll_options?: Json | null
          poll_question?: string | null
          poll_selectable_count?: number | null
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
          segment: string | null
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
          segment?: string | null
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
          segment?: string | null
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
      attendant_has_permission: {
        Args: { _permission_key: string; _store_id: string; _user_id: string }
        Returns: boolean
      }
      calculate_subscription_period_end: {
        Args: { p_billing_cycle: string; p_start_date: string }
        Returns: string
      }
      can_access_store_comandas: {
        Args: { check_store_id: string }
        Returns: boolean
      }
      can_customer_access_comanda: {
        Args: { _comanda_id: string }
        Returns: boolean
      }
      check_subscription_coverage: {
        Args: {
          p_customer_id: string
          p_service_id: string
          p_store_id: string
        }
        Returns: {
          has_coverage: boolean
          is_unlimited: boolean
          plan_name: string
          subscription_id: string
          usage_limit: number
          usages_this_period: number
        }[]
      }
      clean_old_session_context: { Args: never; Returns: undefined }
      cleanup_old_password_calls: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      count_low_stock_products: {
        Args: { p_store_id: string }
        Returns: {
          low_stock_count: number
          out_of_stock_count: number
        }[]
      }
      decrement_product_stock: {
        Args: {
          p_product_id: string
          p_quantity?: number
          p_variant_id?: string
        }
        Returns: Json
      }
      generate_product_slug: {
        Args: { input_store_id: string; product_name: string }
        Returns: string
      }
      generate_professional_slug: {
        Args: { p_name: string; p_professional_id?: string; p_store_id: string }
        Returns: string
      }
      generate_proposal_number: { Args: never; Returns: string }
      generate_proposal_slug: { Args: never; Returns: string }
      get_current_user_type: {
        Args: never
        Returns: Database["public"]["Enums"]["user_type"]
      }
      get_next_comanda_number: {
        Args: { p_store_id: string; p_type?: string }
        Returns: string
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
      get_professional_store_id: {
        Args: { _professional_id: string }
        Returns: string
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
      increment_card_views: { Args: { card_slug: string }; Returns: undefined }
      increment_product_stock: {
        Args: {
          p_product_id: string
          p_quantity?: number
          p_variant_id?: string
        }
        Returns: Json
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
      is_professional_self: {
        Args: { _professional_id: string }
        Returns: boolean
      }
      is_store_admin_of: { Args: { _store_id: string }; Returns: boolean }
      is_store_admin_of_attendant: {
        Args: { attendant_user_id: string }
        Returns: boolean
      }
      is_store_admin_of_professional: {
        Args: { profile_id: string }
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
        | "professional"
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
      user_type: "master_admin" | "store_admin" | "professional"
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
      whatsapp_message_type:
        | "text"
        | "image"
        | "document"
        | "audio"
        | "video"
        | "poll"
        | "list"
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
        "professional",
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
      user_type: ["master_admin", "store_admin", "professional"],
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
      whatsapp_message_type: [
        "text",
        "image",
        "document",
        "audio",
        "video",
        "poll",
        "list",
      ],
    },
  },
} as const
