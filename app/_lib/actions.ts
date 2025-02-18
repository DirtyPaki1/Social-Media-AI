import { auth } from '@clerk/nextjs/server';
import { Database } from './database.types';
import { createAuthenticatedClient } from './supabase';
import { revalidatePath } from '@/node_modules/next/cache';

async function getAuthenticatedClientWithSession() {
  const { sessionId } = auth();
  if (!sessionId) throw new Error("You must log in");
  return await createAuthenticatedClient();
}

export async function createSavedPost(
  newSavedPost: Database["public"]["tables"]["savedPost"]["Insert"]
) {
  const supabase = await getAuthenticatedClientWithSession();
  const { data, error } = await supabase
    .from("savedPosts")
    .insert([newSavedPost])
    .select();

  if (error) {
    console.error('Error saving post:', error);
    throw new Error('Item cannot be saved');
  }

  return data;
}

export async function getSavedPost() {
  const authenticatedClient = await createAuthenticatedClient();
  const { data, error } = await authenticatedClient
    .from('savedPosts')
    .select();

  if (error) {
    console.error('Error loading posts:', error);
    throw new Error('Saved Posts could not be loaded.');
  }

  return data;
}

export async function deleteSavedPost(postId: number, revalidate?: boolean) {
  const supabase = await getAuthenticatedClientWithSession();
  const { data: userPosts, error: checkError } = await supabase
    .from('savedPosts')
    .select();

  if (checkError) {
    console.error('Error checking user posts:', checkError);
    throw new Error('Failed to check user posts');
  }

  const userSavedPostsId = userPosts.map((post) => post.id);
  
  if (!userSavedPostsId.includes(postId)) {
    throw new Error('You are not allowed to delete this item or this item does not exist');
  }

  const { error: deleteError } = await supabase
    .from('savedPosts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    console.error('Error deleting post:', deleteError);
    throw new Error('Saved Post could not be deleted.');
  }

  if (revalidate) {
    await revalidatePath('/saved-posts');
  }

  return { success: true };
}