"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { getAssetPrompt } from "../utils/getAssetPrompt";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import PostsGrid from "./PostsGrid";
import PostsSkeleton from "./PostsSkeleton";
import { useCompletion } from "ai/react";
import { postSchema } from "../api/schema/schema";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";

type PartialObject<T> = {
  [P in keyof T]?: T[P] | undefined;
};

type PostRaw = PartialObject<z.infer<typeof postSchema>["posts"][number]>;

interface RenderPostsProps {
  isLoading: boolean;
  posts?: (PostRaw | undefined)[];
  favouritePosts: string[];
  setFavouritePosts: React.Dispatch<React.SetStateAction<string[]>>;
}

const RenderPosts: React.FC<RenderPostsProps> = ({
  isLoading,
  posts,
  favouritePosts,
  setFavouritePosts,
}) => {
  if (isLoading && !posts) {
    return <PostsSkeleton />;
  }

  if (posts) {
    return (
      <PostsGrid
        postsRaw={posts}
        favouritePosts={favouritePosts}
        setFavouritePosts={setFavouritePosts}
      />
    );
  }

  return null;
};

const parseAIResponse = (htmlString: string): PostRaw[] => {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Find all post elements
  const postElements = doc.querySelectorAll("post");

  return Array.from(postElements).map((post) => {
    const content = post.querySelector("content")?.textContent?.trim();
    const rating = post.querySelector("rating")?.textContent;

    return {
      content: content || "",
      potential: rating ? parseInt(rating) : 0,
    };
  });
};

const ContentGenerator: React.FC = () => {
  const [userInput, setUserInput] = useState("");
  const [posts, setPosts] = useState<PostRaw[]>();
  const [favouritePosts, setFavouritePosts] = useState([""]);
  const [error, setError] = useState("");
  const [rateLimit, setRateLimit] = useState<{
    remaining: number | null;
    limit: number | null;
  }>({ remaining: null, limit: null });
  const { user } = useUser();
  const { openSignIn, closeSignIn } = useClerk();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    completion,
    complete,
    isLoading,
    error: completionError,
  } = useCompletion({
    api: "/api/generate-posts",
    streamProtocol: "text",
    onResponse: (response) => {
      // Update rate limit info from headers
      const remaining = Number(response.headers.get("X-RateLimit-Remaining"));
      const limit = Number(response.headers.get("X-RateLimit-Limit"));
      setRateLimit({ remaining, limit });
    },
    onError: (error) => {
      // Check if it's a rate limit error
      if (error.message.includes("rate limit")) {
        setRateLimit((prev) => ({ ...prev, remaining: 0 }));
      }
      setError(`An error occurred: ${error.message}`);
    },
  });

  // Watch for changes in the completion string and parse it
  useEffect(() => {
    if (completion) {
      try {
        const parsedPosts = parseAIResponse(completion);
        setPosts(parsedPosts);
      } catch (err) {
        setError("Failed to parse the generated content");
        console.error("Parsing error:", err);
      }
    }
  }, [completion]);

  const onSubmitPosts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      openSignIn();
      return;
    }

    setError("");
    setPosts(undefined); // Clear existing posts before generating new ones

    try {
      await complete(userInput, {
        body: { userInput, selectedPosts: favouritePosts },
      });
    } catch (error) {
      setError("There was an error generating content. Please try again.");
    }
  };

  const handleTextareaFocus = () => {
    if (!user) {
      if (textareaRef.current) {
        textareaRef.current.blur(); // Remove focus from the textarea
      }
      openSignIn();
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <RenderPosts
          isLoading={isLoading}
          posts={posts}
          favouritePosts={favouritePosts}
          setFavouritePosts={setFavouritePosts}
        />
      </div>
      <div className="mx-auto p-6 bg-background rounded-lg shadow-md text-foreground max-w-[560px]">
        {rateLimit.remaining !== null && (
          <div className="text-secondary-foreground text-sm mb-4 text-center">
            {rateLimit.remaining} / {rateLimit.limit} generations remaining
            today
          </div>
        )}

        <form onSubmit={onSubmitPosts}>
          {!isLoading && !posts && (
            <div className="mb-5 text-start">
              <Textarea
                ref={textareaRef}
                className="mt-2 resize-none"
                id="user-input"
                placeholder="Enter your topic..."
                rows={15}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onFocus={handleTextareaFocus}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <Button
            className="w-full bg-primary"
            type="submit"
            disabled={isLoading || rateLimit.remaining === 0}
          >
            {isLoading ? (
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-foreground"></div>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                <span>Generate posts</span>
              </>
            )}
          </Button>
        </form>

        {(completionError || error) && (
          <p className="text-red-500 mb-4">
            {completionError?.message || error}
          </p>
        )}
      </div>
    </>
  );
};

export default ContentGenerator;
