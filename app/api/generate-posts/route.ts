import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { HormoziHooks, HormoziOutlierTweets } from "../../data/hormozi";

export const runtime = "edge";

// Utility function to shuffle and trim array
function simpleShuffle<T>(array: T[]): T[] {
  let result = [...array];
  const minLength = Math.floor(array.length * 0.7);
  const targetLength = minLength + Math.floor(Math.random() * (array.length - minLength));

  while (result.length > targetLength) {
    const indexToRemove = Math.floor(Math.random() * result.length);
    result.splice(indexToRemove, 1);
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    console.log("🔹 Raw request body:", rawBody);

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("❌ Error parsing JSON body:", error);
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    // Validate input
    const { userInput, selectedPosts = [] } = body;
    if (!userInput || typeof userInput !== "string" || userInput.trim() === "") {
      console.log("❌ Invalid userInput. Received:", body);
      return NextResponse.json({ error: "Missing or invalid 'userInput'" }, { status: 400 });
    }

    // Prepare shuffled hooks and example tweets
    const shuffledHooks = simpleShuffle(HormoziHooks).join("\n* ");
    const shuffledTweets = simpleShuffle(HormoziOutlierTweets).join("\n\n****\nNEW EXAMPLE:\n\n");

    // Construct AI prompt
    const prompt = `Generate 9 posts based on the topic: "${userInput}". Use the following examples and hooks:
    
    ## HOOKS:
    * ${shuffledHooks}
    
    ## EXAMPLE POSTS:
    ${shuffledTweets}
    
    ## Selected Posts:
    ${selectedPosts.join("\n")}
    
    ## Format output as valid JSON:
    {
      "posts": [
        { "content": "Generated post example", "rating": "8/10" }
      ]
    }`;

    console.log("📝 Generated prompt:", prompt);

    // Send request to AI model
    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt,
    });

    // Ensure response is a valid JSON stream
    if (!result || typeof result.toTextStreamResponse !== "function") {
      console.error("❌ AI response error:", result);
      return NextResponse.json({ error: "Unexpected AI response format" }, { status: 500 });
    }

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("❌ Error in generate-posts API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
