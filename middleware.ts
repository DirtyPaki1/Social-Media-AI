import { ClerkMiddlewareAuth, clerkMiddleware } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "86400 s"), // 10 requests per day
  ephemeralCache: new Map(),
  analytics: true,
});

const isGenerateAPI = (path: string) => {
  return path.match(new RegExp(`^\/api\/generate-.*`));
};

export default clerkMiddleware(
  async (auth: ClerkMiddlewareAuth, request: NextRequest) => {
    const { userId, sessionClaims } = auth();
    const email = sessionClaims?.email as string;

    // Add email to all API requests
    if (request.nextUrl.pathname.startsWith("/api")) {
      const response = NextResponse.next();
      response.headers.set("x-user-email", email);

      // Rate limit check for generate APIs
      if (isGenerateAPI(request.nextUrl.pathname)) {
        const { success, limit, reset, remaining } = await ratelimit.limit(
          `${userId}`
        );

        if (!success) {
          return NextResponse.json({
            message:
              "Sorry you can only generate 10 free batches of posts per day. Reach out to zaurbek@codebender.ai for more.",
          });
        }

        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());
      }

      return response;
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
