import { auth } from "@clerk/nextjs/server";
import { Database } from "./database.types";
import { createAuthenticatedClient } from "./supabase";

/**
 * Gets an authenticated Supabase client with session validation.
 */
async function getAuthenticatedClientWithSession() {
  const { sessionId } = auth();
  if (!sessionId) throw new Error("You must log in");
  return await createAuthenticatedClient();
}

/**
 * Create a saved post in the database.
 */
export async function createSavedPost(
  newSavedPost: Omit<Database["public"]["Tables"]["savedPosts"]["Insert"], "id" | "created_at">
) {
  try {
    const supabase = await getAuthenticatedClientWithSession();

    // Ensure only valid fields are included in the insert
    const formattedPost: Database["public"]["Tables"]["savedPosts"]["Insert"] = {
      post_body: newSavedPost.post_body ?? null,
      post_rating: newSavedPost.post_rating ?? null,
      user_id: newSavedPost.user_id ?? null, // Ensure this field is not null if required
    };

    // Insert into the correct table (check table name in Supabase)
    const { data, error } = await supabase
      .from("savedPosts") // Make sure "savedPosts" is the correct table name
      .insert([formattedPost])
      .select("*");

    if (error) {
      console.error("❌ Error saving post:", error.message);
      throw new Error(`Item cannot be saved: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("❌ createSavedPost error:", err);
    throw err;
  }
}
