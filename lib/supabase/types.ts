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
          rank: "operative" | "archivist" | "director";
          bio: string | null;
          contribution_count: number;
          created_at: string;
        };
        Insert: {
          discord_id: string;
          cmdr_name: string;
          id?: string;
          rank?: "operative" | "archivist" | "director";
          bio?: string | null;
          contribution_count?: number;
          created_at?: string;
        };
        Update: {
          discord_id?: string;
          cmdr_name?: string;
          id?: string;
          rank?: "operative" | "archivist" | "director";
          bio?: string | null;
          contribution_count?: number;
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
          status: "active" | "promising" | "debunked" | "verified";
          evidence_strength: number;
          tags: string[];
          author_id: string | null;
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
          status: "speculative" | "investigating" | "promising" | "eliminated" | "verified";
          score: number;
          what_we_know: string | null;
          submitted_by: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
