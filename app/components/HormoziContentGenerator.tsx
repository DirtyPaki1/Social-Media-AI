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
import { postSchema } from "../api/schema/schema";
import { z } from "zod";

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

const HormoziContentGenerator: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [favouritePosts, setFavouritePosts] = useState([""]);
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
    schema: postSchema,
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
    // Extract video ID from YouTube URL
    const extractVideoId = (url: string) => {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
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

    setDisplayError("");

    try {
      await submit({
        body: { videoUrl, selectedPosts: favouritePosts },
      });
    } catch (error) {
      setDisplayError(
        "There was an error generating content. Please try again."
      );
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <RenderPosts
          isLoading={isLoading}
          posts={linkedInObject?.posts}
          favouritePosts={favouritePosts}
          setFavouritePosts={setFavouritePosts}
        />
      </div>
      <div className="mx-auto p-6 bg-background rounded-lg shadow-md text-foreground max-w-[560px]">
        <form onSubmit={onSubmitPosts}>
          {!isLoading && !linkedInObject?.posts && (
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
