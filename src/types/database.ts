// Supabase-generated types — regenerate with: npx supabase gen types typescript
// This is the manual starter version matching our migration schema.

export type UserRole = 'shopper' | 'butcher' | 'admin';
export type MeatAnimal = 'beef' | 'pork' | 'chicken' | 'goat' | 'lamb' | 'other';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

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
    };
    Functions: {
      calculate_consistency_score: {
        Args: { p_shop_id: string; p_cut_id: string; p_unit_id: string };
        Returns: number | null;
      };
    };
  };
}
