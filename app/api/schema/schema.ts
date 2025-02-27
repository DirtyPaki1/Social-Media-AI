import { z } from "zod";

export const postSchema = z.object({
  posts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
});
