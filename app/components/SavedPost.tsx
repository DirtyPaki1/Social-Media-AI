import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteSavedPost } from "../_lib/actions";
import { SavedPostType } from "./SavedPostsFeed";
import { Separator } from "@/components/ui/separator";

export interface PostType {
  id: number;
  content?: string;
  potential?: number;
}

interface SocialMediaPostProps {
  post: SavedPostType;
  onDelete: (id: number) => void;
}

export default function SavedPost({ post, onDelete }: SocialMediaPostProps) {
  return (
    <div className="p-4 rounded-lg grid grid-rows-[1fr_1rem_40px] border border-border mb-2">
      <p className="whitespace-pre-wrap mb-4">{post.post_body}</p>
      <Separator />
      <div className="flex justify-between items-center">
        <p className="font-semibold">Viral Potential: {post.post_rating}/10</p>
        <Button
          className="hover:bg-destructive"
          variant="outline"
          size="icon"
          onClick={() => onDelete(post.id)}
          aria-label="Delete post"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
