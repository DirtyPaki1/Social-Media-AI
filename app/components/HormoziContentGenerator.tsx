"use client";

import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { getAssetPrompt } from "../utils/getAssetPrompt";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import PostsGrid from "./PostsGrid";
import PostsSkeleton from "./PostsSkeleton";
import { experimental_useObject as useObject } from "ai/react";

// 🔹 Ensure schema.ts exists before uncommenting
// import { postSchema } from "@/api/schema/schema";

interface RenderPostsProps {
  isLoading: boolean;
  posts?: any[];
  favouritePosts: string[];
  setFavouritePosts: React.Dispatch<React.SetStateAction<string[]>>;
}

const RenderPosts: React.FC<RenderPostsProps> = ({
  isLoading,
  posts = [], // Default empty array
  favouritePosts,
  setFavouritePosts,
}) => {
  if (isLoading && !posts.length) {
    return <PostsSkeleton />;
  }

  if (posts.length) {
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

const HormoziContentGenerator: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [favouritePosts, setFavouritePosts] = useState<string[]>([]);
  const [displayError, setDisplayError] = useState("");
  const { user } = useUser();
  const { openSignUp } = useClerk();

  const {
    object: linkedInObject,
    submit,
    isLoading,
    error,
  } = useObject({
    api: "/api/generate-posts-youtube",
    // 🔹 Uncomment if schema.ts exists
    // schema: postSchema,
  });

  useEffect(() => {
    if (user) {
      const savedInput = localStorage.getItem("lastInput");
      if (savedInput) {
        setVideoUrl(savedInput);
        localStorage.removeItem("lastInput");
      }
    }
  }, [user]);

  useEffect(() => {
    const extractVideoId = (url: string) => {
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes("youtube.com")) {
          return urlObj.searchParams.get("v");
        } else if (urlObj.hostname.includes("youtu.be")) {
          return urlObj.pathname.substring(1);
        }
      } catch (err) {
        return null;
      }
    };

    const id = extractVideoId(videoUrl);
    setVideoId(id || "");
  }, [videoUrl]);

  const onSubmitPosts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      localStorage.setItem("lastInput", videoUrl);
      openSignUp();
      return;
    }

    if (!videoUrl.trim()) {
      setDisplayError("Please enter a YouTube video URL.");
      return;
    }

    setDisplayError("");

    try {
      await submit({
        body: { videoUrl, selectedPosts: favouritePosts },
      });
    } catch (err) {
      setDisplayError("There was an error generating content. Please try again.");
      console.error("Error generating posts:", err);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <RenderPosts
          isLoading={isLoading}
          posts={linkedInObject?.posts || []}
          favouritePosts={favouritePosts}
          setFavouritePosts={setFavouritePosts}
        />
      </div>
      <div className="mx-auto p-6 bg-background rounded-lg shadow-md text-foreground max-w-[560px]">
        <form onSubmit={onSubmitPosts}>
          {!isLoading && !linkedInObject?.posts?.length && (
            <>
              <div className="mb-5 text-start">
                <Input
                  id="youtube-link"
                  type="text"
                  placeholder="Enter YouTube video URL..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {videoId && (
                <div className="mb-5">
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </>
          )}

          <Button
            className="w-full bg-primary"
            type="submit"
            disabled={isLoading}
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

        {(error || displayError) && (
          <p className="text-red-500 mb-4">{error?.message || displayError}</p>
        )}
      </div>
    </>
  );
};

export default HormoziContentGenerator;
