import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Debugging: Log your Upstash Redis environment variables
console.log("🔍 UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL);
console.log("🔍 UPSTASH_REDIS_REST_TOKEN:", process.env.UPSTASH_REDIS_REST_TOKEN);

// Initialize Redis client using Upstash values
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Initialize Rate Limiter (10 requests per day per user)
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "86400 s"), // 10 requests per day (86400 seconds)
  ephemeralCache: new Map(),
  analytics: true,
});

// Helper to check if a request path matches your generate API route.
const isGenerateAPI = (path: string) => /^\/api\/generate-.*/.test(path);

export default clerkMiddleware(async (auth, req) => {
  // Extract the userId and sessionClaims from Clerk's auth()
  const { userId, sessionClaims } = auth();

  // Allow public access to the homepage.
  if (req.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  // If no authenticated user is found, return 401 Unauthorized.
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Get the email from session claims (if available)
  const email = sessionClaims?.email as string;

  // If the request is for an API route...
  if (req.nextUrl.pathname.startsWith("/api")) {
    // Create a response instance and set a custom header for debugging.
    const response = NextResponse.next();
    response.headers.set("x-user-email", email);

    // If this API route is one that generates posts, check rate limits.
    if (isGenerateAPI(req.nextUrl.pathname)) {
      const { success, limit, reset, remaining } = await ratelimit.limit(userId);

      if (!success) {
        return NextResponse.json(
          { message: "Sorry, you can only generate 10 free batches per day." },
          { status: 429 }
        );
      }

      // Set rate limit headers on the response
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());
    }

    return response;
  }

  // For all other routes, continue normally.
  return NextResponse.next();
});

// Configure middleware to run on all routes except static assets and _next internals.
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
