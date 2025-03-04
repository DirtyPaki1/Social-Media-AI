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
  newSavedPost: Database["Tables"]["savedPosts"]["Insert"] // ✅ Fixed type reference
) {
  const supabase = await getAuthenticatedClientWithSession();

  const formattedPost: Database["Tables"]["savedPosts"]["Insert"] = {
    post_body: newSavedPost.post_body ?? null,
    post_rating: newSavedPost.post_rating ?? null,
    user_id: newSavedPost.user_id ?? null,
  };

  const { data, error } = await supabase
    .from("savedPosts")
    .insert([formattedPost]) // ✅ Ensure correct data type
    .select();

  if (error) {
    console.error("Error saving post:", error);
    throw new Error("Item cannot be saved");
  }

  return data;
}

/**
 * Get all saved posts.
 */
export async function getSavedPost() {
  const authenticatedClient = await createAuthenticatedClient();
  const { data, error } = await authenticatedClient.from("savedPosts").select();

  if (error) {
    console.error("Error loading posts:", error);
    throw new Error("Saved Posts could not be loaded.");
  }

  return data;
}

/**
 * Delete a saved post.
 */
export async function deleteSavedPost(postId: number, revalidate?: boolean) {
  const supabase = await getAuthenticatedClientWithSession();

  // ✅ Try to delete the post directly and check affected rows
  const { error: deleteError, count } = await supabase
    .from("savedPosts")
    .delete({ count: "exact" })
    .eq("id", postId);

  if (deleteError) {
    console.error("Error deleting post:", deleteError);
    throw new Error("Saved Post could not be deleted.");
  }

  // ✅ Ensure post was actually deleted
  if (count === 0) {
    throw new Error("You are not allowed to delete this item or it does not exist");
  }

  if (revalidate) {
    await revalidatePath("/saved-posts");
  }

  return { success: true };
}
