import { NextResponse } from "next/server";
import { convertToCoreMessages, generateText } from "ai";
import { constants, initializeOpenAI } from "@lib/index";

// Limit streaming responses by x seconds
export const maxDuration = 90;
export const runtime = "edge";

const openai = initializeOpenAI();

export async function POST(req: Request) {
  console.log("api -> classify -> route -> POST");

  try {
    const { animals } = await req.json();
    console.log("api -> classify -> route -> POST -> animals", animals);

    // Call OpenAI API to classify the detected animal
    const { text } = await generateText({
      model: openai(constants.openAI.models.chat),
      messages: convertToCoreMessages([
        {
          role: "system",
          content: `For each animal provided below, classify it as "Friendly", "Dangerous" or "Unclassified". Return the data in the following format:
            [Animal Name]: [The Animal Classification as one word]
            Animals: ${animals}
            Classifications:`,
        },
      ]),
    });
    console.log("api -> classify -> route -> POST -> text", text);

    return Response.json({ text });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
      },
      { status: 500 },
    );
  }
}
