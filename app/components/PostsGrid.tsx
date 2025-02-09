"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { z } from "zod";
import { postSchema } from "../api/schema/schema";
import Post, { PostType } from "./Post";
import { createSavedPost, deleteSavedPost } from "../_lib/actions";

type PartialObject<T> = {
  [P in keyof T]?: T[P] | undefined;
};

type PostRaw = PartialObject<z.infer<typeof postSchema>["posts"][number]>;

interface PostContainerProps {
  postsRaw: (PostRaw | undefined)[];
  favouritePosts: string[];
  setFavouritePosts: React.Dispatch<React.SetStateAction<string[]>>;
  className?: string;
}

export default function PostsGrid({
  postsRaw,
  favouritePosts,
  setFavouritePosts,
  className = "",
}: PostContainerProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isPending, startTransition] = useTransition();
  const [optimisticPosts, optimisticToggle] = useOptimistic<
    PostType[],
    { id: number; favorite: boolean }
  >(posts, (curPosts, { id, favorite }) =>
    curPosts.map((post) =>
      post.id === id ? { ...post, isFavorite: favorite } : post
    )
  );

  useEffect(() => {
    setPosts(
      postsRaw.map((post, i) => ({
        id: i + 1,
        content: post?.content,
        potential: post?.potential,
        isFavorite: false,
      }))
    );
  }, [postsRaw]);

  async function handleFavorite(id: number, supabaseId?: number) {
    const [postToSet] = posts.filter((post) => post.id === id);
    const newFavoriteState = !postToSet.isFavorite;

    startTransition(async () => {
      optimisticToggle({ id, favorite: newFavoriteState });

      try {
        if (!postToSet.isFavorite) {
          const [newSavedPost] = await createSavedPost({
            post_body: postToSet.content,
            post_rating: postToSet.potential,
          });
          setPosts(
            posts.map((post) =>
              post.id === id
                ? { ...post, isFavorite: true, supabaseId: newSavedPost.id }
                : post
            )
          );
          setFavouritePosts([...favouritePosts, postToSet.content ?? ""]);
        } else {
          setFavouritePosts(
            favouritePosts.filter((post) => post !== postToSet.content)
          );
          if (!supabaseId) throw new Error("No SupabaseId found");
          await deleteSavedPost(supabaseId);
          setPosts(
            posts.map((post) =>
              post.id === id ? { ...post, isFavorite: false } : post
            )
          );
        }
      } catch (error) {
        optimisticToggle({ id, favorite: postToSet.isFavorite });
        console.error("Error updating favorite status: ", error);
      }
    });
  }

  async function handleDelete(id: number, supabaseId?: number) {
    startTransition(async () => {
      if (supabaseId) await deleteSavedPost(supabaseId);
      setPosts(posts.filter((post) => post.id !== id));
    });
  }

  return (
    <div
      className={`w-full text-foreground p-6 rounded-lg shadow-lg overflow-hidden grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3 ${className}`}
    >
      {optimisticPosts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onFavorite={handleFavorite}
          onDelete={handleDelete}
          disabled={isPending}
        />
      ))}
    </div>
  );
}
