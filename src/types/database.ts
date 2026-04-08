// Supabase-generated types — regenerate with: npx supabase gen types typescript
// This is the manual starter version matching our migration schema.

export type UserRole = 'shopper' | 'butcher' | 'admin';
export type MeatAnimal = 'beef' | 'pork' | 'chicken' | 'goat' | 'lamb' | 'other';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type SubscriptionStatus = 'free' | 'trial' | 'pro' | 'expired';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          phone: string | null;
          language: 'en' | 'es';
          verified: boolean;
          subscription_status: SubscriptionStatus;
          trial_ends_at: string | null;
          stripe_customer_id: string | null;
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id'>> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      shops: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          address: string;
          city: string;
          state: string;
          zip: string | null;
          phone: string | null;
          location: unknown; // PostGIS geography
          verified: boolean;
          claimed: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shops']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['shops']['Row']>;
      };
      shop_hours: {
        Row: {
          id: string;
          shop_id: string;
          day_of_week: number;
          open_time: string | null;
          close_time: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shop_hours']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['shop_hours']['Row']>;
      };
      meat_cuts: {
        Row: {
          id: string;
          animal: MeatAnimal;
          name_en: string;
          name_es: string;
          alt_names: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meat_cuts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['meat_cuts']['Row']>;
      };
      price_unit: {
        Row: {
          id: string;
          name_en: string;
          name_es: string;
          abbreviation: string;
        };
        Insert: Omit<Database['public']['Tables']['price_unit']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['price_unit']['Row']>;
      };
      prices: {
        Row: {
          id: string;
          shop_id: string;
          cut_id: string;
          unit_id: string;
          price: number;
          submitted_by: string | null;
          is_outlier: boolean;
          recorded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['prices']['Row']>;
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          cut_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
      };
      photos: {
        Row: {
          id: string;
          user_id: string;
          shop_id: string;
          cut_id: string | null;
          storage_path: string;
          moderation: ModerationStatus;
          moderated_by: string | null;
          moderated_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['photos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['photos']['Row']>;
      };
      price_flags: {
        Row: {
          id: string;
          price_id: string;
          flagged_by: string;
          reason: string;
          resolved: boolean;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['price_flags']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['price_flags']['Row']>;
      };
      review_responses: {
        Row: {
          id: string;
          review_id: string;
          responder_id: string;
          response: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['review_responses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['review_responses']['Row']>;
      };
      deep_link_opens: {
        Row: {
          id: string;
          link_type: 'share_card' | 'price_alert' | 'weekly_email';
          target_shop_id: string | null;
          target_cut_id: string | null;
          referrer_user_id: string | null;
          opened_by: string | null;
          opened_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deep_link_opens']['Row'], 'id' | 'opened_at'>;
        Update: Partial<Database['public']['Tables']['deep_link_opens']['Row']>;
      };
    };
    Views: {
      current_prices: {
        Row: {
          id: string;
          shop_id: string;
          cut_id: string;
          unit_id: string;
          price: number;
          recorded_at: string;
          is_outlier: boolean;
        };
      };
      price_history: {
        Row: {
          id: string;
          shop_id: string;
          shop_name: string;
          cut_id: string;
          cut_name_en: string;
          cut_name_es: string;
          unit_id: string;
          unit: string;
          price: number;
          is_outlier: boolean;
          recorded_at: string;
          created_at: string;
          updated_at: string;
          was_revised: boolean;
          days_ago: number;
        };
      };
    };
    Functions: {
      calculate_consistency_score: {
        Args: { p_shop_id: string; p_cut_id: string; p_unit_id: string };
        Returns: number | null;
      };
      upsert_price: {
        Args: {
          p_shop_id: string;
          p_cut_id: string;
          p_unit_id: string;
          p_price: number;
          p_submitted_by?: string | null;
        };
        Returns: string;
      };
      create_price_alert: {
        Args: {
          p_cut_id: string;
          p_unit_id: string;
          p_target_price: number;
          p_latitude: number;
          p_longitude: number;
          p_radius_meters?: number;
        };
        Returns: string;
      };
      search_cuts_fuzzy: {
        Args: { p_query: string; p_limit?: number };
        Returns: Array<{
          id: string;
          animal: MeatAnimal;
          name_en: string;
          name_es: string;
          alt_names: string[];
          similarity_score: number;
        }>;
      };
      log_event: {
        Args: { p_event: string; p_properties?: Record<string, unknown> };
        Returns: void;
      };
      check_pro_access: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      activate_trial: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      activate_pro: {
        Args: { p_user_id: string; p_stripe_id: string };
        Returns: boolean;
      };
      respond_to_review: {
        Args: { p_review_id: string; p_response: string };
        Returns: string;
      };
      check_duplicate_shop: {
        Args: { p_name: string; p_lat: number; p_lon: number };
        Returns: Array<{
          shop_id: string;
          shop_name: string;
          distance_meters: number;
          name_similarity: number;
        }>;
      };
      get_weekly_performance: {
        Args: { p_shop_id: string };
        Returns: Record<string, unknown>;
      };
      get_expansion_readiness: {
        Args: { p_city?: string };
        Returns: Record<string, unknown>;
      };
      log_deep_link_open: {
        Args: {
          p_link_type: string;
          p_shop_id?: string;
          p_cut_id?: string;
          p_referrer_id?: string;
        };
        Returns: void;
      };
      check_feature_access: {
        Args: { p_user_id: string; p_feature: string };
        Returns: boolean;
      };
      get_system_health: {
        Args: Record<string, never>;
        Returns: Record<string, unknown>;
      };
    };
  };
}
