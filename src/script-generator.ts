import Groq from "groq-sdk";
import type { RawChatScript, ChatMessage, Sender } from "./types.ts";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write viral fake ARGUMENT/DEBATE conversations for TikTok/YouTube Shorts.
Two characters argue about who knows more, who is better, or who would win. ALL in ENGLISH.

FORMAT — return JSON only, no prose:
{ "title": "...", "characterA": "Name 🏷️", "characterB": "Name 🏷️", "messages": [{ "sender": "a" | "b", "text": "..." }] }

=== EXAMPLE OF A PERFECT DEBATE ===
Topic: "Chef vs Grandma"
{ "title": "Who Actually Cooks Better?",
  "characterA": "Chef 👨‍🍳", "characterB": "Grandma 👵",
  "messages": [
    { "sender": "a", "text": "I trained in Paris for six years." },
    { "sender": "b", "text": "I have been cooking since before you were born." },
    { "sender": "a", "text": "I cook for Michelin star restaurants." },
    { "sender": "b", "text": "My grandkids cry when they eat your restaurants." },
    { "sender": "a", "text": "Cry from what? The flavor?" },
    { "sender": "b", "text": "From disappointment. Then they call me." },
    { "sender": "a", "text": "Okay name your best dish right now." },
    { "sender": "b", "text": "My lasagna. It heals broken hearts." },
    { "sender": "a", "text": "Lasagna is literally the easiest dish ever." },
    { "sender": "b", "text": "Then why did yours fall apart on national television?" },
    { "sender": "a", "text": "How do you even know about that?" },
    { "sender": "b", "text": "Sweetheart I watched it live. I laughed for an hour." },
    { "sender": "a", "text": "At least I get paid six figures to cook." },
    { "sender": "b", "text": "I get paid in hugs. And my food is still better." },
    { "sender": "a", "text": "You cannot even use a food processor." },
    { "sender": "b", "text": "I do not need one. Everything I make is from the soul." },
    { "sender": "a", "text": "From the soul does not pass a health inspection." },
    { "sender": "b", "text": "Your restaurant got a B rating last March." },
    { "sender": "a", "text": "Wait how do you know that?" },
    { "sender": "b", "text": "Because I reported it. Who won? You tell me." }
  ]
}

STUDY that example. Notice:
 - Every message RESPONDS to what was just said (never random topic jumps)
 - Specific details: "Paris for six years", "national television", "B rating last March"
 - TRAPS: Grandma asks about the lasagna → uses the TV fail against him
 - CALLBACKS: The "how do you know that" payoff connects to earlier knowledge
 - PERSONALITY: Chef is cocky and formal, Grandma is savage and warm
 - HUMOR: "I get paid in hugs. And my food is still better."
 - DEVASTATING ENDING: "Because I reported it." — changes everything

=== RULES ===

1. EVERY message must respond to what was JUST said. No random flexes. This is a real argument.
2. 16-22 messages. Max 10 words per message.
3. Use SPECIFIC details: names, numbers, places, dates. Never vague claims.
4. Each character has a DISTINCT personality. One is not a copy of the other.
5. Include at least one TRAP (innocent question → answer used as weapon later).
6. Include at least one CALLBACK (reference something from earlier for a bigger punch).
7. The ending must be DEVASTATING — a reveal or flip that the viewer did not expect.
8. LAST message must end with "Who won?" or similar to drive comments.

STRUCTURE:
 - Messages 1-4: Bold opening claims from both sides. Hook the viewer.
 - Messages 5-9: One character CHALLENGES the other to prove something. Trap gets set.
 - Messages 10-14: Gets personal. Callbacks to earlier messages. The trap pays off.
 - Messages 15-end: Knockout blow. Loser tries to recover, fails. "Who won?"

LANGUAGE (read aloud by AI voice):
 - Casual but PROPER English — full words, no abbreviations
 - NEVER: "bro", "wdym", "nah", "lol", "omg", "rn", "im", "ur", "tbh", "idk"
 - Sound like real people TALKING — confident, natural, with attitude`;

function stripFences(raw: string): string {
  return raw
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\`\`\`\s*$/i, "")
    .trim();
}

function parseScript(raw: string): RawChatScript {
  const cleaned = stripFences(raw);
  const parsed = JSON.parse(cleaned);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.title !== "string" ||
    typeof parsed.characterA !== "string" ||
    typeof parsed.characterB !== "string" ||
    !Array.isArray(parsed.messages) ||
    parsed.messages.length === 0
  ) {
    throw new Error(
      "Script JSON missing 'title', 'characterA', 'characterB', or 'messages' array",
    );
  }

  for (const msg of parsed.messages) {
    if (
      typeof msg.sender !== "string" ||
      (msg.sender !== "a" && msg.sender !== "b") ||
      typeof msg.text !== "string" ||
      msg.text.trim().length === 0
    ) {
      throw new Error(`Invalid message in script: ${JSON.stringify(msg)}`);
    }
  }

  return {
    title: parsed.title,
    characterA: parsed.characterA,
    characterB: parsed.characterB,
    messages: parsed.messages.map((m: ChatMessage) => ({
      sender: m.sender as Sender,
      text: m.text.trim(),
    })),
  };
}

/**
 * Ask Groq to pick N viral debate topics.
 */
export async function pickTopics(count: number = 3): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const client = new Groq({ apiKey });

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 1.0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You pick viral debate/argument matchups for TikTok content.
Think: two opposing characters arguing about who knows more or who is better.
Examples: "Police vs Drug Dealer", "Chef vs Grandma", "Doctor vs Google", "Hacker vs FBI"
Each topic should be a specific matchup with a clear conflict.
Return JSON ONLY: { "topics": ["topic1", "topic2", ...] }`,
      },
      {
        role: "user",
        content: `Pick ${count} completely different debate matchups. Make them funny, dramatic, and engaging. Format: "X vs Y" — keep each under 8 words.`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");

  const parsed = JSON.parse(stripFences(text));
  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    throw new Error("Failed to parse topics from Groq");
  }

  return parsed.topics.slice(0, count);
}

/**
 * Generate a debate/argument conversation from a topic.
 */
export async function generateScript(topic: string): Promise<RawChatScript> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const client = new Groq({ apiKey });

  const attempt = async (extraInstruction?: string) => {
    const userMessage = extraInstruction
      ? `Topic: ${topic}\n\n${extraInstruction}`
      : `Topic: ${topic}`;

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from Groq");
    return parseScript(text);
  };

  try {
    return await attempt();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return attempt(
      `Previous attempt failed to parse: "${message}". Return ONLY valid JSON matching the schema, no code fences, no commentary.`,
    );
  }
}
