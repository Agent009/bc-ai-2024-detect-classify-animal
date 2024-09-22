import { jsonSchema, generateObject } from "ai";
import { NextResponse } from "next/server";
import { constants, initializeOpenAI } from "@lib/index";

// Limit streaming responses by x seconds
export const maxDuration = 90;
export const runtime = "edge";

const responseSchema = jsonSchema<{
  animals: string[];
}>({
  type: "object",
  properties: {
    animals: { type: "array", items: { type: "string" } },
  },
  required: ["animals"],
});

const openai = initializeOpenAI();

export async function POST(req: Request) {
  console.log("api -> chat -> route -> POST");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const message = formData.get("message") as string;

    if (!file) {
      throw new Error("Please upload an image to continue.");
    }

    const buffer = await file.arrayBuffer();
    // const base64Image = Buffer.from(buffer).toString("base64");
    // const attachments = [{ url: `data:image/jpeg;base64,${base64Image}` }];

    // Ensure maxTokens is within the allowed range
    // const validatedMaxTokens = Math.max(500, Math.min(2000, Math.round(maxTokens / 100) * 100));

    const { object } = await generateObject({
      model: openai(constants.openAI.models.chat),
      messages: [
        {
          role: "system",
          content:
            "You are an expert veteran and safari expert. You will be given an image containing one or more animals. You will return the names of each animal in the image. Return the list of animals in comma-separated format. Do not return any text other than the names of the animals. If you do not detect any animals in the image, return 'None' as the response.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: message,
            },
            {
              type: "image",
              image: buffer,
            },
          ],
        },
      ],
      schema: responseSchema,
    });
    console.log("api -> chat -> route -> POST -> object", object);

    return NextResponse.json({ animals: object?.animals });
  } catch (error) {
    console.error("api -> chat -> error in POST handler:", error);
    return NextResponse.json(
      {
        error: `An error occurred while processing your request: $${error}`,
      },
      { status: 500 },
    );
  }
}
