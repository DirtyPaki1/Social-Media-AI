"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PostsGrid from "./PostsGrid";
import PostsSkeleton from "./PostsSkeleton";

type PostRaw = { content: string; potential?: number };

const RenderPosts: React.FC<{ isLoading: boolean; posts?: PostRaw[]; favouritePosts: string[]; setFavouritePosts: React.Dispatch<React.SetStateAction<string[]>>; }> = ({ isLoading, posts, favouritePosts, setFavouritePosts }) => {
  if (isLoading) return <PostsSkeleton />;
  if (posts?.length) return <PostsGrid postsRaw={posts} favouritePosts={favouritePosts} setFavouritePosts={setFavouritePosts} />;
  return null;
};

const ContentGenerator: React.FC = () => {
  const [userInput, setUserInput] = useState("");
  const [posts, setPosts] = useState<PostRaw[]>([]);
  const [favouritePosts, setFavouritePosts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onSubmitPosts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!user) {
        openSignIn();
        return;
      }
      if (!userInput.trim()) {
        throw new Error("Enter a topic before generating posts.");
      }

      console.log("📤 Submitting user input:", userInput);

      const response = await fetch("/api/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: userInput.trim(),
          selectedPosts: favouritePosts,
        }),
      });

      // Check for network errors before parsing the JSON response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate posts");
      }

      const data = await response.json();

      console.log("✅ Generated Posts:", data.posts);
      setPosts(data.posts);
      setUserInput("");
      textareaRef.current?.focus();
    } catch (err: any) {
      // Enhanced error handling
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("Network error: Failed to fetch data from the server.");
      } else {
        setError(err.message || "Unknown error occurred.");
      }
      console.error("❌ Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <RenderPosts isLoading={isSubmitting} posts={posts} favouritePosts={favouritePosts} setFavouritePosts={setFavouritePosts} />
      </div>
      <div className="mx-auto p-6 bg-background rounded-lg shadow-md text-foreground max-w-[560px]">
        <form onSubmit={onSubmitPosts}>
          <Textarea
            ref={textareaRef}
            placeholder="Enter your topic..."
            rows={5}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Loading..." : "Generate Posts"}
          </Button>
        </form>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </>
  );
};

export default ContentGenerator;
