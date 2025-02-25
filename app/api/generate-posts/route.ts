import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { HormoziHooks, HormoziOutlierTweets } from "../../data/hormozi";

export const runtime = "edge";

// Helper function to shuffle an array and reduce its length.
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
    // The system instruction forces the AI to output strictly valid JSON.
    "I will give you a topic. Generate 9 posts based on the following rules and examples. Your response MUST be strictly valid JSON and nothing else. Do not output any extra text, markdown, code fences, or comments.",
  ];

  sections.push("## RULES:\n" + DEFAULT_RULES.map(rule => `- ${rule}`).join("\n") + "\n");
  sections.push(`## HOOKS:\n${shuffledHooks}\n`);
  sections.push(`## EXAMPLE POSTS:\n${shuffledTweets}\n\n${selectedPosts || ""}\n`);
  sections.push(`## SOURCE TOPIC:\n${userInput}\n`);
  // IMPORTANT: This is the ONLY output the AI should produce.
  sections.push(`## OUTPUT FORMAT (strictly valid JSON, nothing else):
{
  "posts": [
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    },
    {
      "content": "Replace this with generated post content",
      "rating": "Replace this with a rating (e.g., 8/10)"
    }
  ]
}`);
  
  return sections.join("\n-------\n");
}

export async function POST(req: Request) {
  try {
    // Read and log the raw request body.
    const rawBody = await req.text();
    console.log("rawBody:", rawBody);

    let body: any;
    try {
      body = JSON.parse(rawBody);
      console.log("Parsed once:", body);
    } catch (error) {
      console.error("Error parsing JSON body:", error);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // If the payload is wrapped in a "prompt" field, parse it.
    if (body.prompt && typeof body.prompt === "string") {
      try {
        body = JSON.parse(body.prompt);
        console.log("Parsed from body.prompt:", body);
      } catch (error) {
        console.error("Error parsing the prompt field:", error);
        return NextResponse.json({ error: "Invalid request body encoding in prompt" }, { status: 400 });
      }
    }

    const { userInput, selectedPosts } = body;
    if (!userInput || typeof userInput !== "string") {
      console.log("Missing userInput. Received:", body);
      return NextResponse.json(
        { error: "Missing or invalid required field: userInput", received: body },
        { status: 400 }
      );
    }

    const shuffledHooks = simpleShuffle(HormoziHooks).join("\n* ");
    const shuffledTweets = simpleShuffle(HormoziOutlierTweets).join("\n\n****\nNEW EXAMPLE:\n\n");
    const prompt = buildPrompt(userInput, shuffledHooks, shuffledTweets, selectedPosts);
    console.log("Final prompt:", prompt);

    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt,
    });

    if (!result || typeof result.toTextStreamResponse !== "function") {
      throw new Error("Unexpected response format from AI model");
    }

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error in generate-posts API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
