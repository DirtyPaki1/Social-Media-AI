import { auth } from "@clerk/nextjs/server";
import { Database } from "./database.types";
import { createAuthenticatedClient } from "./supabase";
import { revalidatePath } from "next/cache";

async function getAuthenticatedClientWithSession() {
  const { sessionId } = auth();
  if (!sessionId) throw new Error("You must log in");
  return await createAuthenticatedClient();
}

/**
 * Create a saved post.
 */
export async function createSavedPost(
  newSavedPost: Omit<Database["public"]["Tables"]["savedPosts"]["Insert"], "id" | "created_at">
) {
  try {
    const supabase = await getAuthenticatedClientWithSession();

    const formattedPost: Database["public"]["Tables"]["savedPosts"]["Insert"] = {
      post_body: newSavedPost.post_body ?? null,
      post_rating: newSavedPost.post_rating ?? null,
      user_id: newSavedPost.user_id ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("savedPosts").insert([formattedPost]).select("*");

    if (error) {
      console.error("Error saving post:", error.message);
      throw new Error(`Item cannot be saved: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("createSavedPost error:", err);
    throw err;
  }
}

