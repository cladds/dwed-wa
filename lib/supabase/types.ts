// Placeholder types until generated via:
// npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts

export interface Database {
  public: {
    Tables: {
      operatives: {
        Row: {
          id: string;
          discord_id: string;
          cmdr_name: string;
          rank: "recruit" | "investigator" | "senior_investigator" | "analyst" | "lead_investigator" | "director";
          bio: string | null;
          contribution_points: number;
          created_at: string;
        };
        Insert: {
          discord_id: string;
          cmdr_name: string;
          id?: string;
          rank?: "recruit" | "investigator" | "senior_investigator" | "analyst" | "lead_investigator" | "director";
          bio?: string | null;
          contribution_points?: number;
          created_at?: string;
        };
        Update: {
          discord_id?: string;
          cmdr_name?: string;
          id?: string;
          rank?: "recruit" | "investigator" | "senior_investigator" | "analyst" | "lead_investigator" | "director";
          bio?: string | null;
          contribution_points?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      dossiers: {
        Row: {
          id: string;
          slug: string;
          title: string;
          hypothesis: string;
          status: "open_lead" | "under_investigation" | "promising" | "verified" | "disproven" | "dead_end" | "cold";
          evidence_strength: number;
          tags: string[];
          author_id: string | null;
          status_changed_by: string | null;
          status_changed_at: string | null;
          original_author: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          hypothesis: string;
          id?: string;
          status?: string;
          evidence_strength?: number;
          tags?: string[];
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          hypothesis?: string;
          id?: string;
          status?: string;
          evidence_strength?: number;
          tags?: string[];
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      system_tickets: {
        Row: {
          id: string;
          system_name: string;
          coord_x: number | null;
          coord_y: number | null;
          coord_z: number | null;
          edsm_id: string | null;
          status: "open_lead" | "under_investigation" | "promising" | "verified" | "disproven" | "dead_end" | "cold";
          score: number;
          what_we_know: string | null;
          submitted_by: string | null;
          original_author: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          system_name: string;
          id?: string;
          coord_x?: number | null;
          coord_y?: number | null;
          coord_z?: number | null;
          edsm_id?: string | null;
          status?: string;
          score?: number;
          what_we_know?: string | null;
          submitted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          system_name?: string;
          id?: string;
          coord_x?: number | null;
          coord_y?: number | null;
          coord_z?: number | null;
          edsm_id?: string | null;
          status?: string;
          score?: number;
          what_we_know?: string | null;
          submitted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      evidence: {
        Row: {
          id: string;
          type: "screenshot" | "calculation" | "lore" | "mechanic" | "anomaly" | "video";
          description: string;
          url: string | null;
          dossier_id: string | null;
          ticket_id: string | null;
          body_name: string | null;
          coord_lat: number | null;
          coord_lon: number | null;
          is_location_specific: boolean;
          spoiler_gated: boolean;
          submitted_by: string | null;
          created_at: string;
        };
        Insert: {
          type: "screenshot" | "calculation" | "lore" | "mechanic" | "anomaly" | "video";
          description: string;
          id?: string;
          url?: string | null;
          dossier_id?: string | null;
          ticket_id?: string | null;
          body_name?: string | null;
          coord_lat?: number | null;
          coord_lon?: number | null;
          is_location_specific?: boolean;
          spoiler_gated?: boolean;
          submitted_by?: string | null;
          created_at?: string;
        };
        Update: {
          type?: "screenshot" | "calculation" | "lore" | "mechanic" | "anomaly" | "video";
          description?: string;
          id?: string;
          url?: string | null;
          dossier_id?: string | null;
          ticket_id?: string | null;
          body_name?: string | null;
          coord_lat?: number | null;
          coord_lon?: number | null;
          is_location_specific?: boolean;
          spoiler_gated?: boolean;
          submitted_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      intel_threads: {
        Row: {
          id: string;
          title: string;
          dossier_id: string | null;
          ticket_id: string | null;
          pinned: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          title: string;
          id?: string;
          dossier_id?: string | null;
          ticket_id?: string | null;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          id?: string;
          dossier_id?: string | null;
          ticket_id?: string | null;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          thread_id: string;
          content: string;
          author_id: string | null;
          created_at: string;
        };
        Insert: {
          thread_id: string;
          content: string;
          id?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Update: {
          thread_id?: string;
          content?: string;
          id?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      map_zones: {
        Row: {
          id: string;
          name: string;
          type: "permit-lock" | "naming-cluster" | "investigation" | "debunked";
          centre_x: number | null;
          centre_y: number | null;
          centre_z: number | null;
          radius_ly: number | null;
          colour: string | null;
          dossier_id: string | null;
          description: string | null;
          created_by: string | null;
        };
        Insert: {
          name: string;
          type: "permit-lock" | "naming-cluster" | "investigation" | "debunked";
          id?: string;
          centre_x?: number | null;
          centre_y?: number | null;
          centre_z?: number | null;
          radius_ly?: number | null;
          colour?: string | null;
          dossier_id?: string | null;
          description?: string | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          type?: "permit-lock" | "naming-cluster" | "investigation" | "debunked";
          id?: string;
          centre_x?: number | null;
          centre_y?: number | null;
          centre_z?: number | null;
          radius_ly?: number | null;
          colour?: string | null;
          dossier_id?: string | null;
          description?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      system_cache: {
        Row: {
          id: string;
          system_name: string;
          edsm_id: string | null;
          id64: string | null;
          coord_x: number | null;
          coord_y: number | null;
          coord_z: number | null;
          edsm_data: Record<string, unknown> | null;
          spansh_data: Record<string, unknown> | null;
          allegiance: string | null;
          government: string | null;
          population: number | null;
          security: string | null;
          economy: string | null;
          needs_permit: boolean;
          fetched_at: string;
        };
        Insert: {
          system_name: string;
          id?: string;
          edsm_id?: string | null;
          id64?: string | null;
          coord_x?: number | null;
          coord_y?: number | null;
          coord_z?: number | null;
          edsm_data?: Record<string, unknown> | null;
          spansh_data?: Record<string, unknown> | null;
          allegiance?: string | null;
          government?: string | null;
          population?: number | null;
          security?: string | null;
          economy?: string | null;
          needs_permit?: boolean;
          fetched_at?: string;
        };
        Update: {
          system_name?: string;
          id?: string;
          edsm_id?: string | null;
          id64?: string | null;
          coord_x?: number | null;
          coord_y?: number | null;
          coord_z?: number | null;
          edsm_data?: Record<string, unknown> | null;
          spansh_data?: Record<string, unknown> | null;
          allegiance?: string | null;
          government?: string | null;
          population?: number | null;
          security?: string | null;
          economy?: string | null;
          needs_permit?: boolean;
          fetched_at?: string;
        };
        Relationships: [];
      };
      theories: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string;
          status: "open_lead" | "under_investigation" | "promising" | "verified" | "disproven" | "dead_end" | "cold";
          category: "theory" | "system" | "lore" | "mechanic" | "evidence";
          source: "open" | "forum";
          systems_mentioned: string[];
          evidence_count: number;
          source_post_count: number;
          created_by: string | null;
          original_author: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          slug: string;
          summary: string;
          category: string;
          id?: string;
          status?: string;
          source?: string;
          systems_mentioned?: string[];
          evidence_count?: number;
          source_post_count?: number;
          created_by?: string | null;
          original_author?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          summary?: string;
          category?: string;
          id?: string;
          status?: string;
          source?: string;
          systems_mentioned?: string[];
          evidence_count?: number;
          source_post_count?: number;
          created_by?: string | null;
          original_author?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      forum_posts: {
        Row: {
          id: string;
          forum_post_id: string;
          thread_id: string;
          page_number: number;
          post_number: number | null;
          author_name: string;
          author_id: string | null;
          content_html: string;
          content_text: string;
          posted_at: string | null;
          scraped_at: string;
          ai_processed: boolean;
          ai_processed_at: string | null;
        };
        Insert: {
          forum_post_id: string;
          author_name: string;
          content_html: string;
          content_text: string;
          page_number: number;
          id?: string;
          thread_id?: string;
          post_number?: number | null;
          author_id?: string | null;
          posted_at?: string | null;
          scraped_at?: string;
          ai_processed?: boolean;
          ai_processed_at?: string | null;
        };
        Update: {
          forum_post_id?: string;
          author_name?: string;
          content_html?: string;
          content_text?: string;
          page_number?: number;
          id?: string;
          thread_id?: string;
          post_number?: number | null;
          author_id?: string | null;
          posted_at?: string | null;
          scraped_at?: string;
          ai_processed?: boolean;
          ai_processed_at?: string | null;
        };
        Relationships: [];
      };
      extracted_leads: {
        Row: {
          id: string;
          forum_post_id: string | null;
          lead_type: "theory" | "system" | "evidence" | "lore" | "mechanic";
          title: string;
          summary: string;
          systems_mentioned: string[];
          coordinates: Record<string, number> | null;
          confidence: "low" | "medium" | "high";
          status: "unreviewed" | "imported" | "dismissed";
          original_author: string | null;
          source_url: string | null;
          theory_id: string | null;
          linked_dossier_id: string | null;
          linked_ticket_id: string | null;
          created_at: string;
        };
        Insert: {
          lead_type: string;
          title: string;
          summary: string;
          id?: string;
          forum_post_id?: string | null;
          systems_mentioned?: string[];
          coordinates?: Record<string, number> | null;
          confidence?: string;
          status?: string;
          original_author?: string | null;
          source_url?: string | null;
          theory_id?: string | null;
          linked_dossier_id?: string | null;
          linked_ticket_id?: string | null;
          created_at?: string;
        };
        Update: {
          lead_type?: string;
          title?: string;
          summary?: string;
          id?: string;
          forum_post_id?: string | null;
          theory_id?: string | null;
          systems_mentioned?: string[];
          coordinates?: Record<string, number> | null;
          confidence?: string;
          status?: string;
          original_author?: string | null;
          source_url?: string | null;
          linked_dossier_id?: string | null;
          linked_ticket_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      theory_comments: {
        Row: {
          id: string;
          theory_id: string;
          content: string;
          author_id: string | null;
          author_name: string;
          created_at: string;
        };
        Insert: {
          theory_id: string;
          content: string;
          author_name: string;
          id?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Update: {
          theory_id?: string;
          content?: string;
          author_name?: string;
          id?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      theory_links: {
        Row: {
          id: string;
          theory_a_id: string;
          theory_b_id: string;
          reason: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          theory_a_id: string;
          theory_b_id: string;
          reason: string;
          id?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          theory_a_id?: string;
          theory_b_id?: string;
          reason?: string;
          id?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      codex_comments: {
        Row: {
          id: string;
          article_id: string;
          content: string;
          author_id: string | null;
          author_name: string;
          created_at: string;
        };
        Insert: {
          article_id: string;
          content: string;
          author_name: string;
          id?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Update: {
          article_id?: string;
          content?: string;
          author_name?: string;
          id?: string;
          author_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      codex_articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          category: "mystery" | "lore" | "faction" | "location" | "mechanic" | "history" | "guide";
          cover_image: string | null;
          sources: Array<{ url: string; title: string; type: string }>;
          tags: string[];
          published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          slug: string;
          content: string;
          category: string;
          id?: string;
          excerpt?: string | null;
          cover_image?: string | null;
          sources?: unknown;
          tags?: string[];
          published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          content?: string;
          category?: string;
          id?: string;
          excerpt?: string | null;
          cover_image?: string | null;
          sources?: unknown;
          tags?: string[];
          published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
