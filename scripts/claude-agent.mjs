#!/usr/bin/env node

/**
 * Claude API wrapper for SwarmVille agent spawning
 * Uses Anthropic SDK directly for better control
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const prompt = process.argv[2];

if (!prompt) {
  console.error("Error: No prompt provided");
  process.exit(1);
}

// Read API key from parent .env file
const envPath = join(process.cwd(), "..", ".env");
let apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  try {
    const envContent = readFileSync(envPath, "utf-8");
    const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match) {
      apiKey = match[1].trim();
    }
  } catch (err) {
    console.error("Error reading .env file:", err.message);
  }
}

if (!apiKey) {
  console.error("Error: ANTHROPIC_API_KEY not found in environment or .env file");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

async function runClaude() {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response = message.content[0].text;
    console.log(response);
    process.exit(0);
  } catch (error) {
    console.error("Claude API error:", error.message);
    process.exit(1);
  }
}

runClaude();
