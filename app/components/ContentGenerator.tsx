"use client";
import React, { useState, useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import PostsGrid from "./PostsGrid";
import PostsSkeleton from "./PostsSkeleton";
import { useCompletion } from "ai/react";
import { Textarea } from "@/components/ui/textarea";

type PostRaw = {
  content: string;
  potential?: number;
};

interface RenderPostsProps {
  isLoading: boolean;
  posts?: PostRaw[];
  favouritePosts: string[];
  setFavouritePosts: React.Dispatch<React.SetStateAction<string[]>>;
}

const RenderPosts: React.FC<RenderPostsProps> = ({
  isLoading,
  posts,
  favouritePosts,
  setFavouritePosts,
}) => {
  if (isLoading) {
    return <PostsSkeleton />;
  }
  if (posts?.length) {
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

const ContentGenerator: React.FC = () => {
  const [userInput, setUserInput] = useState("");
  const [posts, setPosts] = useState<PostRaw[]>([]);
  const [favouritePosts, setFavouritePosts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [rateLimit, setRateLimit] = useState<{ 
    remaining: number | null; 
    limit: number | null; 
  }>({
    remaining: null,
    limit: null,
  });
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { completion, complete, isLoading, error: completionError } = useCompletion({
    api: "/api/generate-posts",
    streamProtocol: "text",
    onResponse: (response) => {
      setRateLimit({
        remaining: Number(response.headers.get("X-RateLimit-Remaining")),
        limit: Number(response.headers.get("X-RateLimit-Limit")),
      });
    },
    onError: (error) => {
      if (error.message.includes("rate limit")) {
        setRateLimit((prev) => ({ ...prev, remaining: 0 }));
      }
      setError(`An error occurred: ${error.message}`);
    },
  });

  useEffect(() => {
    if (completion) {
      try {
        const parsedPosts = JSON.parse(completion) as PostRaw[];
        setPosts(parsedPosts);
      } catch (err) {
        setError("Failed to parse the generated content. Please try again.");
        console.error("Parsing error:", err, "Completion:", completion);
      }
    }
  }, [completion]);

  const onSubmitPosts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError("");
    setIsSubmitting(true);

    try {
      if (!user) {
        openSignIn();
        return;
      }

      if (!userInput.trim()) {
        throw new Error("Please enter some content to generate posts");
      }

      // Pass a JSON-stringified payload (since useCompletion expects a string)
      complete(JSON.stringify({ userInput, selectedPosts: favouritePosts }));

      setUserInput("");
      textareaRef.current?.focus();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error generating posts:", err);
    } finally {
      setIsSubmitting(false);
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
            {rateLimit.remaining} / {rateLimit.limit} generations remaining today
          </div>
        )}
        <form onSubmit={onSubmitPosts}>
          {!isLoading && posts.length === 0 && (
            <div className="mb-5 text-start">
              <Textarea
                ref={textareaRef}
                className="mt-2 resize-none"
                placeholder="Enter your topic..."
                rows={5}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                required
              />
            </div>
          )}
          <Button 
            className="w-full bg-primary" 
            type="submit" 
            disabled={isLoading || rateLimit.remaining === 0 || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-foreground"></div>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                <span>Generate posts</span>
              </>
            )}
          </Button>
        </form>
        {(completionError || error || apiError) && (
          <p className="text-red-500 mb-4">
            {completionError?.message || error || apiError}
          </p>
        )}
      </div>
    </>
  );
};

export default ContentGenerator;
