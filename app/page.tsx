import ContentGenerator from "./components/ContentGenerator";
import RateLimitDisplay from "./components/RateLimitDisplay";

export default function Home() {
  return (
    <main className="App">
      <div className="container flex flex-col justify-center">
        <div>
          <div className="logoBox max-w-3xl m-auto">
            <h1 className="text-foreground font-bold sm:text-5xl sm:mb-4 mb-2 text-4xl">
              Hormozi AI Agent
            </h1>
            <p className="text-secondary-foreground">
              Generate LinkedIn posts in the style of Alex Hormozi.
            </p>
          </div>
          <ContentGenerator />
        </div>
      </div>
    </main>
  );
}
