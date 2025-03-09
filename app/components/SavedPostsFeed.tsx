"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import SavedPost from "./SavedPost";
import { useOptimistic } from "react";
import { deleteSavedPost } from "../_lib/actions";

export type SavedPostType = {
  created_at: string;
  id: number;
  post_body: string | null;
  post_rating: number | null;
  user_id: string | null;
};

type SavedPostsType = {
  savedPosts: SavedPostType[];
};

function SavedPostsFeed({ savedPosts }: SavedPostsType) {
  const [optimisticPosts, optimisticDelete] = useOptimistic(
    savedPosts,
    (curSavedPosts, savedPostId) => {
      return curSavedPosts.filter((savedPost) => savedPost.id !== savedPostId);
    }
  );

  async function handleDelete(id: number) {
    optimisticDelete(id);
    await deleteSavedPost(id, true);
  }

  return (
    <ScrollArea className="border border-border p-4 rounded-lg my-4 text-start h-[85vh] max-w-[36rem] m-auto">
      {optimisticPosts.map((post) => (
        <SavedPost post={post} key={post.id} onDelete={handleDelete} />
      ))}
    </ScrollArea>
  );
}

export default SavedPostsFeed;
