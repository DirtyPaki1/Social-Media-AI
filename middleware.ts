import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Debugging: Check if environment variables are loaded
console.log("🔍 UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL);
console.log("🔍 UPSTASH_REDIS_REST_TOKEN:", process.env.UPSTASH_REDIS_REST_TOKEN);

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Initialize Rate Limiter (10 requests per day)
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "86400 s"), // 10 requests per day
  ephemeralCache: new Map(),
  analytics: true,
});

// Function to check if the request is for generate API
const isGenerateAPI = (path: string) => /^\/api\/generate-.*/.test(path);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = auth();
  
  // Allow public access to homepage
  if (req.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  // Check authentication
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const email = sessionClaims?.email as string;

  // Handle API rate limiting
  if (req.nextUrl.pathname.startsWith("/api")) {
    const response = NextResponse.next();
    response.headers.set("x-user-email", email);

    if (isGenerateAPI(req.nextUrl.pathname)) {
      const { success, limit, reset, remaining } = await ratelimit.limit(userId);

      if (!success) {
        return NextResponse.json(
          { message: "Sorry, you can only generate 10 free batches per day." },
          { status: 429 }
        );
      }

      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());
    }

    return response;
  }

  return NextResponse.next();
});

// Configure middleware matcher
export const config = {
  matcher: ["/((?!.+.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
