export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Main database type definition
export type Database = {
  graphql_public: {
    Tables: Record<string, never>; // Adjust as needed for GraphQL public tables
    Views: Record<string, never>; // Adjust as needed for views
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>; // Define Enums if any
    CompositeTypes: Record<string, never>; // Define composite types if any
  };
  public: {
    Tables: {
      savedPosts: {
        Row: {
          id: number;
          created_at: string;
          post_body: string | null;
          post_rating: number | null;
          user_id: string | null;
        };
        Insert: {
          id?: number; // Primary key, should be auto-generated
          created_at?: string; // Defaults to current timestamp
          post_body?: string | null;
          post_rating?: number | null;
          user_id?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          post_body?: string | null;
          post_rating?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "savedPosts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>; // Adjust as needed for views
    Functions: {
      requesting_user_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>; // Define Enums if any
    CompositeTypes: Record<string, never>; // Define composite types if any
  };
};

type PublicSchema = Database["public"];

// Table Row Type
export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

// Insert Type
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

// Update Type
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

// Enum Type
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

// Composite Types
export type CompositeTypes<T extends keyof PublicSchema["CompositeTypes"]> =
  PublicSchema["CompositeTypes"][T];
