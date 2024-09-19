// import { jsonSchema } from "ai";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { constants } from "@lib/index";

// Limit streaming responses by x seconds
export const maxDuration = 90;
export const runtime = "edge";

// const animalsSchema = jsonSchema<{
//   animals: string[];
// }>({
//   type: "object",
//   properties: {
//     animals: { type: "array", items: { type: "string" } },
//   },
//   required: ["animals"],
// });

const openai = new OpenAI();

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
    const base64Image = Buffer.from(buffer).toString("base64");

    const response = await openai.chat.completions.create({
      model: constants.openAI.models.chat,
      messages: [
        {
          role: "system",
          content:
            "You are an expert veteran and safari expert. You will be given an image containing one or more animals. You will return the names of each animal in the image. Return the list of animals in comma-separated format. Do not return any text other than the names of the animals. If you do not detect any animals in the image, return 'None' as the response.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: message },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });
    console.log("api -> chat -> POST -> response", response);
    const animalList = response.choices[0].message.content;
    const animals = animalList?.split(",").map((animal) => animal.trim());
    console.log("api -> chat -> POST -> animals", animals);

    return NextResponse.json({ animals });
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
