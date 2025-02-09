"use server";

// import { createClerkSupabaseClient } from "./supabase";

import { createAuthenticatedClient, supabase } from "./supabase";

// const supabase = createClerkSupabaseClient();

export async function getSavedPosts() {
  const authenticatedClient = await createAuthenticatedClient();

  // const { data, error } = await supabase.from("savedPosts").select();
  const { data, error } = await authenticatedClient.from("savedPosts").select();

  if (error) {
    console.error(error);
    throw new Error("Saved posts could not be loaded");
  }

  return data;
}
