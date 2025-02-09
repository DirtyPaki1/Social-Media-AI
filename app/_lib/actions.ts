"use server";

import { auth } from "@clerk/nextjs/server";
import { Database } from "./database.types";
import { createAuthenticatedClient } from "./supabase";
import { getSavedPosts } from "./data-services";
import { revalidatePath } from "next/cache";

async function getAuthenticatedClientWithSession() {
  const { sessionId } = auth();
  if (!sessionId) throw new Error("You must be logged in");
  return await createAuthenticatedClient();
}

export async function createSavedPost(
  newSavedPost: Database["public"]["Tables"]["savedPosts"]["Insert"]
) {
  const supabase = await getAuthenticatedClientWithSession();

  const { data, error } = await supabase
    .from("savedPosts")
    .insert([newSavedPost])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Item could not be saved.");
  }

  return data;
}

export async function deleteSavedPost(postId: number, revalidate?: boolean) {
  const supabase = await getAuthenticatedClientWithSession();

  const usersSavedPosts = await getSavedPosts();
  const usersSavedPostIds = usersSavedPosts.map((post) => post.id);

  if (!usersSavedPostIds.includes(postId))
    throw new Error(
      "You are not allowed to delete this item OR this item does not exist"
    );

  const { error } = await supabase.from("savedPosts").delete().eq("id", postId);

  if (error) {
    console.error(error);
    throw new Error("Saved post could not be deleted");
  }

  if (revalidate) revalidatePath("/");
}
