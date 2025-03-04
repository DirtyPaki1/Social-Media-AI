import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { Database } from "./database.types"; // Ensure this path is correct

// Environment variables with fallback checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

/**
 * Creates a base Supabase client using public environment variables.
 */
export function createBaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates an authenticated Supabase client using a Clerk token.
 */
export async function createAuthenticatedClient() {
  try {
    const { getToken } = auth();
    const clerkToken = await getToken({ template: "supabase" });

    if (!clerkToken) {
      throw new Error("Failed to retrieve Clerk token.");
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    });
  } catch (error) {
    console.error("Error creating authenticated Supabase client:", error);
    throw new Error("Could not authenticate with Supabase.");
  }
}
