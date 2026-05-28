/**
 * Supabase 데이터베이스 스키마 타입.
 * 마이그레이션이 늘어나면 `supabase gen types typescript` 로 자동 생성한 결과로 교체.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          birth: string | null;
          email: string | null;
          style: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          has_onboarded: boolean;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          birth?: string | null;
          email?: string | null;
          style?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          has_onboarded?: boolean;
          is_admin?: boolean;
        };
        Update: {
          name?: string | null;
          birth?: string | null;
          email?: string | null;
          style?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          has_onboarded?: boolean;
          is_admin?: boolean;
        };
        Relationships: [];
      };
      running_records: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          dist: string | null;
          pace: string | null;
          bpm: number | null;
          time: string | null;
          note: string | null;
          elev: string | null;
          cadence: number | null;
          kcal: number | null;
          screenshot_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          dist?: string | null;
          pace?: string | null;
          bpm?: number | null;
          time?: string | null;
          note?: string | null;
          elev?: string | null;
          cadence?: number | null;
          kcal?: number | null;
          screenshot_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["running_records"]["Insert"]>;
        Relationships: [];
      };
      running_splits: {
        Row: {
          id: string;
          record_id: string;
          idx: number;
          km: number | string | null;
          time: string | null;
          pace: string | null;
          bpm: number | null;
        };
        Insert: {
          id?: string;
          record_id: string;
          idx: number;
          km?: number | string | null;
          time?: string | null;
          pace?: string | null;
          bpm?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["running_splits"]["Insert"]>;
        Relationships: [];
      };
      gallery_cards: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          month: number;
          date_label: string;
          title: string | null;
          dist: string | null;
          pace: string | null;
          time: string | null;
          kcal: number | null;
          elev: string | null;
          bpm: number | null;
          cadence: number | null;
          likes: number;
          comments: number;
          bg: string;
          snapshot: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          month: number;
          date_label: string;
          title?: string | null;
          dist?: string | null;
          pace?: string | null;
          time?: string | null;
          kcal?: number | null;
          elev?: string | null;
          bpm?: number | null;
          cadence?: number | null;
          likes?: number;
          comments?: number;
          bg: string;
          snapshot?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["gallery_cards"]["Insert"]>;
        Relationships: [];
      };
      saved_styles: {
        Row: {
          id: string;
          user_id: string;
          kind: "saved" | "mine";
          source_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: "saved" | "mine";
          source_id?: string | null;
          payload: Json;
        };
        Update: Partial<Database["public"]["Tables"]["saved_styles"]["Insert"]>;
        Relationships: [];
      };
      ai_journals: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          saved_at: string;
          summary: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          saved_at?: string;
          summary: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_journals"]["Insert"]>;
        Relationships: [];
      };
      community_posts: {
        Row: {
          id: string;
          author_id: string;
          type: "photo" | "stats";
          dist: string | null;
          time: string | null;
          pace: string | null;
          cal: string | null;
          extra: string | null;
          brand: string | null;
          bg: string;
          image_url: string | null;
          tall: boolean;
          avatar_bg: string | null;
          caption: string | null;
          tags: string | null;
          likes: number;
          comments: number;
          date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          type: "photo" | "stats";
          dist?: string | null;
          time?: string | null;
          pace?: string | null;
          cal?: string | null;
          extra?: string | null;
          brand?: string | null;
          bg: string;
          image_url?: string | null;
          tall?: boolean;
          avatar_bg?: string | null;
          caption?: string | null;
          tags?: string | null;
          likes?: number;
          comments?: number;
          date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["community_posts"]["Insert"]>;
        Relationships: [];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_comments"]["Insert"]>;
        Relationships: [];
      };
      post_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      post_saves: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          category: string;
          body: string;
          user_agent: string | null;
          app_version: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          category?: string;
          body: string;
          user_agent?: string | null;
          app_version?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          title: string;
          body: string;
          reply: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: string;
          title: string;
          body: string;
          reply?: string | null;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
