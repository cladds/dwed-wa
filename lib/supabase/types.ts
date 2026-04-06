// Generated types will be placed here after running:
// npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
//
// For now, export an empty Database type so imports don't break.

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
        Insert: Omit<Database["public"]["Tables"]["operatives"]["Row"], "id" | "contribution_count" | "created_at"> & {
          id?: string;
          contribution_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["operatives"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["dossiers"]["Row"], "id" | "status" | "evidence_strength" | "tags" | "created_at" | "updated_at"> & {
          id?: string;
          status?: string;
          evidence_strength?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dossiers"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["system_tickets"]["Row"], "id" | "status" | "score" | "created_at" | "updated_at"> & {
          id?: string;
          status?: string;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["system_tickets"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["evidence"]["Row"], "id" | "is_location_specific" | "spoiler_gated" | "created_at"> & {
          id?: string;
          is_location_specific?: boolean;
          spoiler_gated?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["evidence"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["intel_threads"]["Row"], "id" | "pinned" | "created_at"> & {
          id?: string;
          pinned?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["intel_threads"]["Insert"]>;
      };
      posts: {
        Row: {
          id: string;
          thread_id: string;
          content: string;
          author_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["posts"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["map_zones"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["map_zones"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
