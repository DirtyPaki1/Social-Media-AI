import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { HormoziHooks, HormoziOutlierTweets } from "../../data/hormozi";

export const runtime = "edge";

function simpleShuffle<T>(array: T[]): T[] {
  let result = [...array];

  // Randomly decide how many elements to keep (between 70-100% of original length)
  const minLength = Math.floor(array.length * 0.7);
  const targetLength =
    minLength + Math.floor(Math.random() * (array.length - minLength));

  // Remove random elements until we reach target length
  while (result.length > targetLength) {
    const indexToRemove = Math.floor(Math.random() * result.length);
    result.splice(indexToRemove, 1);
  }

  // Single pass Fisher-Yates shuffle
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

  sections.push(
    "## RULES:\n" + DEFAULT_RULES.map((rule) => `- ${rule}`).join("\n") + "\n"
  );

  sections.push(
    `## HOOKS:\nThe post has to start with a strong and concise hook sentence.\nYou can use these hook formulas (or OCCASIONALLY come up with better ones based on the list):\n${shuffledHooks}\n`
  );

  sections.push(
    `## EXAMPLE POSTS:\nThe post should have one sentence per line and LINE BREAKS between each lines, like the posts below.\nYou can use these posts as inspiration for the WRITTING STYLE only (don't copy the content):\n\n${shuffledTweets}\n\n${
      selectedPosts || ""
    }\n`
  );

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
    const { prompt: userInput, selectedPosts } = await req.json();

    const shuffledHooks = simpleShuffle(HormoziHooks).join("\n* ");
    const shuffledTweets = simpleShuffle(HormoziOutlierTweets).join(
      "\n\n****\nNEW EXAMPLE:\n\n"
    );

    const prompt = buildPrompt(
      userInput,
      shuffledHooks,
      shuffledTweets,
      selectedPosts
    );

    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in generate-tweets API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
