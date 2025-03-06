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

    // ✅ Ensure correct type structure
    const formattedPost: Partial<Database["public"]["Tables"]["savedPosts"]["Insert"]> = {
      post_body: newSavedPost.post_body ?? null,
      post_rating: newSavedPost.post_rating ?? null,
      user_id: newSavedPost.user_id ?? null,
    };

    // ✅ Wrap in an array (Supabase requires an array)
    const { data, error } = await supabase.from("savedPosts").insert([formattedPost]).select();

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

/**
 * Get all saved posts.
 */
export async function getSavedPost() {
  try {
    const authenticatedClient = await createAuthenticatedClient();
    const { data, error } = await authenticatedClient.from("savedPosts").select();

    if (error) {
      console.error("Error loading posts:", error.message);
      throw new Error(`Saved Posts could not be loaded: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("getSavedPost error:", err);
    throw err;
  }
}

/**
 * Delete a saved post.
 */
export async function deleteSavedPost(postId: number, revalidate?: boolean) {
  try {
    const supabase = await getAuthenticatedClientWithSession();

    // ✅ Ensure select() is valid after delete()
    const { error: deleteError, count } = await supabase
      .from("savedPosts")
      .delete()
      .eq("id", postId)
      .select("id"); // Ensure at least one column is selected

    if (deleteError) {
      console.error("Error deleting post:", deleteError.message);
      throw new Error(`Saved Post could not be deleted: ${deleteError.message}`);
    }

    if (!count || count === 0) {
      throw new Error("You are not allowed to delete this item or it does not exist");
    }

    if (revalidate) {
      await revalidatePath("/saved-posts");
    }

    return { success: true };
  } catch (err) {
    console.error("deleteSavedPost error:", err);
    throw err;
  }
}
