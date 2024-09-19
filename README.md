# Detect and Classify Animals

Uses concepts of **AI image detection and classification** and **AI agents** to run **workflows**.

* Week 5 Group Project: Use computer vision model to detect and classify the animal, and create an AI Agent that can find a page in Wikipedia with the name of the animal, retrieve the description, and determine if the animal is dangeroususe 

## Instructions / README

- [Lesson-20 / Weekend Project](https://github.com/Encode-Club-AI-Bootcamp/Generative-AI-Applications/tree/main/Lesson-20#weekend-project)

## Setup

Copy `.env` and create your `.env.local` file, replacing placeholder values with actual values.

## Running

```bash
npm i
npm run dev
```

Open [http://localhost:3091](http://localhost:3091) with your browser to see the result.

## Running with local OpenAI

Start the local OpenAI server such as [text-generation-webui](https://github.com/oobabooga/text-generation-webui), ensuring the API is accessible. For `text-generation-webui`, this can be done via the `--api` flag. The local OpenAI server should be accessible at something like: `http://localhost:5000/v1`.

Then, update `.env.local` with the correct base URL and API key (if required).

Then, navigate to the [route.ts](./src/app/api/chat/route.ts) file and uncomment the `createOpenAI` line.
For best results, use a low-latency models such as `llama-2-7b-chat.Q4_0.gguf`.

## Resources

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app), created as part of **Encode_AI-and-GPT-Bootcamp-Q3-2024**.

- [GitHub Repo - Encode-Club-AI-Bootcamp / Generative-AI-Applications](https://github.com/Encode-Club-AI-Bootcamp/Generative-AI-Applications)
