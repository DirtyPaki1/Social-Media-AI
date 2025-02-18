import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { HormoziHooks, HormoziOutlierTweets } from "../../data/hormozi";

export const runtime = "edge";

function simpleShuffle<T>(array: T[]): T[] {
  let result = [...array];
  const minLength = Math.floor(array.length * 0.7);
  const targetLength = minLength + Math.floor(Math.random() * (array.length - minLength));
  while (result.length > targetLength) {
    const indexToRemove = Math.floor(Math.random() * result.length);
    result.splice(indexToRemove, 1);
  }
  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const DEFAULT_RULES = [
  "Start with a strong and concise hook",
  "Don't use emojis",
  "Limit it to one sentence per line",
  "Have a LINE BREAK between each line",
  "Use the most fitting HOOK and EXAMPLE POST from the list below as inspiration",
  "Only use content provided in the topic. Do NOT invent new data",
];

function buildPrompt(
  userInput: string, 
  shuffledHooks: string, 
  shuffledTweets: string, 
  selectedPosts?: string
): string {
  const sections = [
    "I will give you a topic. Generate 9 posts based on the following rules and post examples. Your response should only include the HTML output format that I will provide.\n",
  ];

  sections.push("## RULES:\n" + DEFAULT_RULES.map((rule) => `- ${rule}`).join("\n") + "\n");
  sections.push(`## HOOKS:\n${shuffledHooks}\n`);
  sections.push(`## EXAMPLE POSTS:\n${shuffledTweets}\n\n${selectedPosts || ""}\n`);
  sections.push(`## SOURCE TOPIC:\n${userInput}\n`);
  sections.push(`## OUTPUT FORMAT:
<posts>
  <post>
    <content>
    --YOUR POST CONTENT HERE--
    </content>
    <rating>
    --YOUR POST RATING HERE--
    </rating>
  </post>
  --REPEAT FOR EACH POST--
<posts>\n`);
  
  return sections.join("\n-------\n");
}

export async function POST(req: Request) {
  try {
    // Read the raw body as text
    const rawBody = await req.text();
    console.log("rawBody:", rawBody);
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("Error parsing JSON body:", error);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // If the parsed body is still a string (double-encoded), parse it again.
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (error) {
        console.error("Error parsing double-encoded JSON body:", error);
        return NextResponse.json({ error: "Invalid request body encoding" }, { status: 400 });
      }
    }

    // Expecting 'userInput' field
    const { userInput, selectedPosts } = body;

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json({ error: "Missing or invalid required field: userInput" }, { status: 400 });
    }

    const shuffledHooks = simpleShuffle(HormoziHooks).join("\n* ");
    const shuffledTweets = simpleShuffle(HormoziOutlierTweets).join("\n\n****\nNEW EXAMPLE:\n\n");

    const prompt = buildPrompt(userInput, shuffledHooks, shuffledTweets, selectedPosts);

    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"), // Verify your model name
      prompt,
    });

    if (!result || typeof result.toTextStreamResponse !== "function") {
      throw new Error("Unexpected response format from AI model");
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in generate-posts API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
