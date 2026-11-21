export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ApiDatabase = {
  public: {
    Tables: {
      bookings: {
        Row: {
          amount: number;
          booking_date: string | null;
          created_at: string;
          guests: number;
          host_id: string | null;
          id: string;
          item_id: string;
          item_type: ApiDatabase["public"]["Enums"]["item_type"];
          listing_id: string | null;
          notes: string | null;
          status: ApiDatabase["public"]["Enums"]["booking_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          booking_date?: string | null;
          created_at?: string;
          guests?: number;
          host_id?: string | null;
          id?: string;
          item_id: string;
          item_type: ApiDatabase["public"]["Enums"]["item_type"];
          listing_id?: string | null;
          notes?: string | null;
          status?: ApiDatabase["public"]["Enums"]["booking_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          booking_date?: string | null;
          created_at?: string;
          guests?: number;
          host_id?: string | null;
          id?: string;
          item_id?: string;
          item_type?: ApiDatabase["public"]["Enums"]["item_type"];
          listing_id?: string | null;
          notes?: string | null;
          status?: ApiDatabase["public"]["Enums"]["booking_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      community_posts: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          image_url: string | null;
          listing_id: string | null;
          title: string | null;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          listing_id?: string | null;
          title?: string | null;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          listing_id?: string | null;
          title?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_posts_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      competitions: {
        Row: {
          capacity: number;
          category: string;
          coming_soon: boolean;
          created_at: string;
          description: string | null;
          description_en: string | null;
          ends_at: string;
          entry_fee: number;
          featured: boolean;
          host_id: string | null;
          id: string;
          image_url: string | null;
          location: string;
          participants_count: number;
          prize_amount: number;
          starts_at: string;
          status: ApiDatabase["public"]["Enums"]["competition_status"];
          title: string;
          title_en: string | null;
          updated_at: string;
        };
        Insert: {
          capacity?: number;
          category: string;
          coming_soon?: boolean;
          created_at?: string;
          description?: string | null;
          description_en?: string | null;
          ends_at: string;
          entry_fee?: number;
          featured?: boolean;
          host_id?: string | null;
          id?: string;
          image_url?: string | null;
          location: string;
          participants_count?: number;
          prize_amount?: number;
          starts_at: string;
          status?: ApiDatabase["public"]["Enums"]["competition_status"];
          title: string;
          title_en?: string | null;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          category?: string;
          coming_soon?: boolean;
          created_at?: string;
          description?: string | null;
          description_en?: string | null;
          ends_at?: string;
          entry_fee?: number;
          featured?: boolean;
          host_id?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string;
          participants_count?: number;
          prize_amount?: number;
          starts_at?: string;
          status?: ApiDatabase["public"]["Enums"]["competition_status"];
          title?: string;
          title_en?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          item_type: ApiDatabase["public"]["Enums"]["item_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          item_type: ApiDatabase["public"]["Enums"]["item_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          item_type?: ApiDatabase["public"]["Enums"]["item_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      feature_requests: {
        Row: {
          admin_note: string | null;
          amount: number;
          created_at: string;
          host_id: string;
          id: string;
          listing_id: string;
          payment_method: string;
          payment_status: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          admin_note?: string | null;
          amount?: number;
          created_at?: string;
          host_id: string;
          id?: string;
          listing_id: string;
          payment_method?: string;
          payment_status?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          admin_note?: string | null;
          amount?: number;
          created_at?: string;
          host_id?: string;
          id?: string;
          listing_id?: string;
          payment_method?: string;
          payment_status?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feature_requests_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      host_verifications: {
        Row: {
          created_at: string;
          first_name: string;
          id: string;
          id_back_path: string | null;
          id_front_path: string | null;
          last_name: string;
          national_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          first_name: string;
          id?: string;
          id_back_path?: string | null;
          id_front_path?: string | null;
          last_name: string;
          national_id: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          first_name?: string;
          id?: string;
          id_back_path?: string | null;
          id_front_path?: string | null;
          last_name?: string;
          national_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          capacity: number | null;
          category: string | null;
          created_at: string;
          description: string | null;
          description_en: string | null;
          discount: number;
          ends_at: string | null;
          host_id: string;
          id: string;
          images: string[];
          is_featured: boolean;
          location: string | null;
          price: number;
          starts_at: string | null;
          status: string;
          title: string;
          title_en: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          capacity?: number | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          description_en?: string | null;
          discount?: number;
          ends_at?: string | null;
          host_id: string;
          id?: string;
          images?: string[];
          is_featured?: boolean;
          location?: string | null;
          price?: number;
          starts_at?: string | null;
          status?: string;
          title: string;
          title_en?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          description_en?: string | null;
          discount?: number;
          ends_at?: string | null;
          host_id?: string;
          id?: string;
          images?: string[];
          is_featured?: boolean;
          location?: string | null;
          price?: number;
          starts_at?: string | null;
          status?: string;
          title?: string;
          title_en?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read: boolean;
          title: string;
          type: ApiDatabase["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read?: boolean;
          title: string;
          type?: ApiDatabase["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read?: boolean;
          title?: string;
          type?: ApiDatabase["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_type: string;
          age: number | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          is_blocked: boolean;
          location: string | null;
          phone: string | null;
          role_selected: boolean;
          updated_at: string;
        };
        Insert: {
          account_type?: string;
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          is_blocked?: boolean;
          location?: string | null;
          phone?: string | null;
          role_selected?: boolean;
          updated_at?: string;
        };
        Update: {
          account_type?: string;
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          is_blocked?: boolean;
          location?: string | null;
          phone?: string | null;
          role_selected?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          image_url: string | null;
          listing_id: string;
          rating: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          listing_id: string;
          rating: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          listing_id?: string;
          rating?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      user_contacts: {
        Row: {
          created_at: string;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: ApiDatabase["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: ApiDatabase["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: ApiDatabase["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      volunteer_requests: {
        Row: {
          accessibility: string | null;
          age: number | null;
          availability: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          email: string;
          experience: string | null;
          full_name: string;
          id: string;
          interest_area: string;
          languages: string[];
          location: string | null;
          motivation: string;
          phone: string;
          rating: number | null;
          skills: string[];
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          accessibility?: string | null;
          age?: number | null;
          availability: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email: string;
          experience?: string | null;
          full_name: string;
          id?: string;
          interest_area: string;
          languages?: string[];
          location?: string | null;
          motivation: string;
          phone: string;
          rating?: number | null;
          skills?: string[];
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          accessibility?: string | null;
          age?: number | null;
          availability?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string;
          experience?: string | null;
          full_name?: string;
          id?: string;
          interest_area?: string;
          languages?: string[];
          location?: string | null;
          motivation?: string;
          phone?: string;
          rating?: number | null;
          skills?: string[];
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      volunteer_service_requests: {
        Row: {
          created_at: string;
          id: string;
          location: string;
          notes: string | null;
          people_count: number;
          reason: string;
          requested_date: string;
          requested_time: string | null;
          requester_id: string;
          status: string;
          updated_at: string;
          volunteer_id: string;
          volunteer_user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          location: string;
          notes?: string | null;
          people_count?: number;
          reason: string;
          requested_date: string;
          requested_time?: string | null;
          requester_id: string;
          status?: string;
          updated_at?: string;
          volunteer_id: string;
          volunteer_user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          location?: string;
          notes?: string | null;
          people_count?: number;
          reason?: string;
          requested_date?: string;
          requested_time?: string | null;
          requester_id?: string;
          status?: string;
          updated_at?: string;
          volunteer_id?: string;
          volunteer_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_service_requests_volunteer_id_fkey";
            columns: ["volunteer_id"];
            isOneToOne: false;
            referencedRelation: "volunteer_requests";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: ApiDatabase["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "user" | "host" | "admin";
      booking_status: "pending" | "confirmed" | "cancelled" | "completed";
      competition_status: "draft" | "upcoming" | "open" | "closed" | "completed" | "cancelled";
      item_type: "competition" | "stay" | "experience" | "product";
      notification_type:
        "booking_confirmed" | "booking_status" | "competition_update" | "new_message" | "system";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type ApiDatabaseWithoutInternals = ApiDatabase;

type DefaultSchema = ApiDatabaseWithoutInternals[Extract<keyof ApiDatabase, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof ApiDatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof ApiDatabaseWithoutInternals;
  }
    ? keyof (ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof ApiDatabaseWithoutInternals;
}
  ? (ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof ApiDatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof ApiDatabaseWithoutInternals;
  }
    ? keyof ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof ApiDatabaseWithoutInternals;
}
  ? ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof ApiDatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof ApiDatabaseWithoutInternals;
  }
    ? keyof ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof ApiDatabaseWithoutInternals;
}
  ? ApiDatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof ApiDatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof ApiDatabaseWithoutInternals;
  }
    ? keyof ApiDatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof ApiDatabaseWithoutInternals;
}
  ? ApiDatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof ApiDatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof ApiDatabaseWithoutInternals;
  }
    ? keyof ApiDatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof ApiDatabaseWithoutInternals;
}
  ? ApiDatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "host", "admin"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      competition_status: ["draft", "upcoming", "open", "closed", "completed", "cancelled"],
      item_type: ["competition", "stay", "experience", "product"],
      notification_type: [
        "booking_confirmed",
        "booking_status",
        "competition_update",
        "new_message",
        "system",
      ],
    },
  },
} as const;
