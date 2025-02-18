import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { Database } from "./database.types"; // Ensure this path is correct

/**
 * Creates a base Supabase client using environment variables.
 */
export function createBaseClient() {
  return createClient<Database>(
    process.env.NEXT_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_ANON_KEY!
  );
}

/**
 * Creates an authenticated Supabase client using a Clerk token.
 */
export async function createAuthenticatedClient() {
  const { getToken } = auth();
  const clearToken = await getToken({ template: "supabase" });

  return createClient<Database>(
    process.env.NEXT_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clearToken}`,
        },
      },
    }
  );
}
