import { NextResponse } from "next/server";
import { convertToCoreMessages, generateObject, jsonSchema } from "ai";
import { constants, initializeOpenAI } from "@lib/index";

// Limit streaming responses by x seconds
export const maxDuration = 90;
export const runtime = "edge";

const responseSchema = jsonSchema<{
  classifications: object[];
}>({
  type: "object",
  properties: {
    classifications: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, classification: { type: "string" } },
        required: ["name", "classification"],
      },
    },
  },
  required: ["classifications"],
});

const openai = initializeOpenAI();

export async function POST(req: Request) {
  console.log("api -> classify -> route -> POST");

  try {
    const { animals } = await req.json();
    console.log("api -> classify -> route -> POST -> animals", animals);

    // Call OpenAI API to classify the detected animal
    const { object } = await generateObject({
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
      schema: responseSchema,
    });
    console.log("api -> classify -> route -> POST -> object", object);

    return NextResponse.json({ classifications: object?.classifications });
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
