import { Database } from "./database.types";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Create a basic Supabase client without Clerk integration
const createBaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Create a Clerk-authenticated Supabase client (use this in server components/actions)
export async function createAuthenticatedClient() {
  const { getToken } = auth();
  const clerkToken = await getToken({ template: "supabase" });

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    }
  );
}

// Export a base client for non-authenticated operations
export const supabase = createBaseClient();
