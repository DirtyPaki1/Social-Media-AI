import HormoziContentGenerator from "../components/HormoziContentGenerator";

export default function Hormozi() {
  return (
    <main className="App">
      <div className="container flex flex-col justify-center">
        <div>
          <div className="logoBox max-w-3xl m-auto">
            <h1 className="text-foreground font-bold sm:text-5xl sm:mb-4 mb-2 text-4xl">
              Hormozi AI Agent
            </h1>
            <p className="text-secondary-foreground">
              Repurpose your YouTube videos into LinkedIn posts in the style of
              Alex Hormozi.
            </p>
          </div>
          <HormoziContentGenerator />
        </div>
      </div>
    </main>
  );
}
