import { currentUser } from "@clerk/nextjs/server"; // ✅ Correct import for Next.js App Router
import ContentGenerator from "./components/ContentGenerator";
import RateLimitDisplay from "./components/RateLimitDisplay";

export default async function Page() {
  const user = await currentUser(); // ✅ This will now work correctly

  return (
    <main className="App">
      <div className="container flex flex-col justify-center">
        <div>
          <div className="logoBox max-w-3xl m-auto text-center">
            <h1 className="text-foreground font-bold sm:text-5xl sm:mb-4 mb-2 text-4xl">
              Hormozi AI Agent
            </h1>
            <p className="text-secondary-foreground">
              Generate LinkedIn posts in the style of Alex Hormozi.
            </p>
          </div>

          {user ? (
            <>
              <RateLimitDisplay />
              <ContentGenerator />
            </>
          ) : (
            <p className="text-red-500 text-center">Please sign in to continue.</p>
          )}
        </div>
      </div>
    </main>
  );
}

