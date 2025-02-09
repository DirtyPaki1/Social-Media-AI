"use client";

import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { getAssetPrompt } from "../utils/getAssetPrompt";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  linkedInIsLoading: boolean;
  twitterPosts?: (PostRaw | undefined)[];
  linkedInPosts?: (PostRaw | undefined)[];
  favouritePosts: string[];
  setFavouritePosts: React.Dispatch<React.SetStateAction<string[]>>;
}

const RenderPosts: React.FC<RenderPostsProps> = ({
  isLoading,
  linkedInIsLoading,
  twitterPosts,
  linkedInPosts,
  favouritePosts,
  setFavouritePosts,
}) => {
  if (isLoading || linkedInIsLoading) {
    return <PostsSkeleton />;
  }

  if (linkedInPosts) {
    return (
      <PostsGrid
        postsRaw={linkedInPosts}
        favouritePosts={favouritePosts}
        setFavouritePosts={setFavouritePosts}
      />
    );
  }

  if (twitterPosts) {
    return (
      <PostsGrid
        postsRaw={twitterPosts}
        favouritePosts={favouritePosts}
        setFavouritePosts={setFavouritePosts}
      />
    );
  }

  return null;
};

const DefaultContentGenerator: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [xPosts, setXPosts] = useState("");
  const [linkedInPosts, setLinkedInPosts] = useState("");
  const [favouritePosts, setFavouritePosts] = useState([""]);
  const [displayError, setDisplayError] = useState("");
  const { user } = useUser();
  const { openSignUp } = useClerk();

  const {
    object: tweetsObject,
    submit,
    isLoading,
    error,
  } = useObject({
    api: "/api/generate-tweets",
    schema: postSchema,
  });

  const {
    object: linkedInObject,
    submit: linkedInSubmit,
    isLoading: linkedInIsLoading,
    error: linkedInError,
  } = useObject({
    api: "/api/generate-linkedin-posts",
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

  const onSubmitXPosts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      localStorage.setItem("lastInput", videoUrl);
      openSignUp();
      return;
    }

    setDisplayError("");

    try {
      await submit({
        body: { videoUrl, exampleTweets: xPosts },
      });
    } catch (error) {
      setDisplayError(
        "There was an error generating content. Please try again."
      );
    }
  };

  const onSubmitLinkedInPosts = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!user) {
      openSignUp();
      return;
    }

    setDisplayError("");

    try {
      await linkedInSubmit({
        body: {
          videoUrl,
          exampleLinkedInPosts: linkedInPosts,
          selectedTweets: favouritePosts,
        },
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
          linkedInIsLoading={linkedInIsLoading}
          twitterPosts={tweetsObject?.posts}
          linkedInPosts={linkedInObject?.posts}
          favouritePosts={favouritePosts}
          setFavouritePosts={setFavouritePosts}
        />
      </div>
      <div className="mx-auto p-6 bg-background rounded-lg shadow-md text-foreground max-w-4xl">
        <form
          onSubmit={
            !tweetsObject?.posts ? onSubmitXPosts : onSubmitLinkedInPosts
          }
          className="space-y-4"
        >
          {!isLoading && !tweetsObject?.posts && (
            <>
              <div className="space-y-2 mb-10 text-start">
                <Input
                  id="youtube-link"
                  type="text"
                  placeholder="Enter YouTube video URL..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <p>Paste sample posts from 𝕏 and LinkedIn to help guide the AI</p>
              <div className="grid sm:grid-cols-2 grid-cols-1 sm:space-x-2">
                <div className="text-start">
                  <Textarea
                    className="mt-2 resize-none"
                    id="x-posts"
                    placeholder="Paste example 𝕏 posts here..."
                    rows={20}
                    value={xPosts}
                    onChange={(e) => setXPosts(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="text-start">
                  <Textarea
                    className="mt-2 resize-none"
                    id="linkedin-posts"
                    placeholder="Paste example LinkedIn posts here..."
                    rows={20}
                    value={linkedInPosts}
                    onChange={(e) => setLinkedInPosts(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          {!linkedInObject?.posts && (
            <Button
              className="w-full bg-primary"
              type="submit"
              disabled={isLoading || linkedInIsLoading}
            >
              {isLoading || linkedInIsLoading ? (
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {!tweetsObject?.posts ? (
                    <span>Generate 𝕏 posts</span>
                  ) : (
                    <span>Generate LinkedIn posts</span>
                  )}
                </>
              )}
            </Button>
          )}
        </form>

        {(error || linkedInError || displayError) && (
          <p className="text-red-500 mb-4">
            {error?.message || linkedInError?.message || displayError}
          </p>
        )}
      </div>
    </>
  );
};

export default DefaultContentGenerator;
