import { NextResponse } from "next/server";
import { convertToCoreMessages, generateText, jsonSchema, tool } from "ai";
import { constants, initializeOpenAI } from "@lib/index";

// Limit streaming responses by x seconds
export const maxDuration = 90;
export const runtime = "edge";

const animalsSchema = jsonSchema<{
  animals: string[];
}>({
  type: "object",
  properties: {
    animals: { type: "array", items: { type: "string" } },
  },
  additionalProperties: false,
  required: ["animals"],
});
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
        additionalProperties: false,
        required: ["name", "classification"],
      },
    },
  },
  additionalProperties: false,
  required: ["classifications"],
});

const openai = initializeOpenAI();

// Function to search Wikipedia for the animal classification
async function searchWikipedia(animal: string): Promise<string> {
  console.log("api -> classify -> route -> toolCall -> searchWikipedia -> animal", animal);
  const response = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(animal)}&format=json&origin=*`,
  );
  const data = await response.json();
  // Return the snippet of the first search result as a simple classification source
  return data.query.search.length > 0 ? data.query.search[0].snippet : "No information found";
}

// Function to classify the animal based on the Wikipedia result
function classifyAnimal(result: string): string {
  console.log("api -> classify -> route -> toolCall -> classifyAnimal -> result", result);
  // Simple classification logic based on keywords in the result
  if (result.includes("dangerous") || result.includes("attack") || result.includes("predator")) {
    return "Dangerous";
  } else if (result.includes("friendly") || result.includes("domestic") || result.includes("pet")) {
    return "Friendly";
  } else {
    return "Unclassified";
  }
}

export async function POST(req: Request) {
  console.log("api -> classify -> route -> POST");

  try {
    const { animals } = await req.json();
    console.log("api -> classify -> route -> POST -> animals", animals);

    // Call OpenAI API to classify the detected animal
    const { finishReason, responseMessages, text, toolCalls, toolResults, usage, warnings } = await generateText({
      model: openai(constants.openAI.models.chat, { structuredOutputs: true }),
      messages: convertToCoreMessages([
        {
          role: "system",
          content: 'For each specified animal, classify it as "Friendly", "Dangerous" or "Unclassified".',
        },
        {
          role: "user",
          content: `${animals}`,
        },
      ]),
      // schema: responseSchema,
      tools: {
        classify: tool({
          description:
            "A tool for fetching the animal classification by searching Wikipedia. Should return one of: Friendly, Dangerous, Unclassified. The animals will be provided as an array of one or more items.",
          parameters: animalsSchema,
          execute: async ({ animals }) => {
            const classifications = await Promise.all(
              animals.map(async (animal) => {
                const result = await searchWikipedia(animal);
                return classifyAnimal(result);
              }),
            );
            return { classifications };
          },
        }),
        // answer tool: the LLM will provide a structured answer
        answer: tool({
          description: "A tool for providing the final answer. Return the answer in JSON format.",
          parameters: responseSchema,
          // no execute function - invoking it will terminate the agent
        }),
      },
      toolChoice: "required",
      maxToolRoundtrips: 10,
      // onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
      //   console.log("api -> classify -> route -> POST -> onStepFinish -> text", text, "finishReason", finishReason);
      //   console.log("toolCalls", toolCalls, "toolResults", toolResults, "usage", usage);
      // },
    });
    console.log(
      "api -> classify -> route -> POST -> response",
      text,
      "toolCalls",
      toolCalls,
      "finishReason",
      finishReason,
      "toolResults",
      toolResults,
      "responseMessages",
      responseMessages,
      "usage",
      usage,
      "warnings",
      warnings,
    );

    return NextResponse.json({ classifications: text });
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
