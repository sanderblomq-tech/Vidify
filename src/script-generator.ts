import Groq from "groq-sdk";
import type { RawChatScript, ChatMessage, Sender } from "./types.ts";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write SHORT, viral fake ARGUMENT/DEBATE conversations for TikTok/YouTube Shorts.
Two characters with opposing identities argue about who knows more, who is better, or who would win.
This is a DEBATE — both characters are confident, funny, and trying to one-up each other.

ALL conversations must be in ENGLISH.

FORMAT:
You must return JSON with:
 - "title": A catchy debate title (e.g. "Who Knows The Streets Better?")
 - "characterA": Character A name + emoji (e.g. "Police 🚔")
 - "characterB": Character B name + emoji (e.g. "Dealer 💊")
 - "messages": Array of { "sender": "a" or "b", "text": "..." }

THE HOOK — FIRST 3 SECONDS DECIDE EVERYTHING:
The first message should be a BOLD claim that makes people stop scrolling.
Examples:
 - "I know every single drug on the street."
 - "I could hack into any system in ten seconds."
 - "Nobody cooks better than me. Nobody."
 - "I have fired more people than you have ever met."

STRUCTURE:
 - 16-22 messages total, alternating between "a" and "b" (can send 2 in a row for emphasis)
 - Max 10 words per message — SHORT and punchy
 - Act 1 (messages 1-3): Both characters make bold opening claims. Establish the conflict.
 - Act 2 (messages 4-14): ESCALATION — each message is a comeback, a burn, a flex, or a revelation. Every message should make the viewer think "OH SNAP". They challenge each other with facts, experiences, or savage one-liners.
 - Act 3 (last 4-6 messages): CLIMAX — one character drops a DEVASTATING argument or reveal that the other cannot counter. The loser tries to recover but fails. Clear winner.
 - FINAL MESSAGE (ALWAYS): The LAST message must ALWAYS be one of them saying something like "Who won? Comment below." or "Who do you think won?" or "You tell me who won this one." This drives engagement and comments.

WHAT MAKES DEBATES GO VIRAL:
 - Both characters are LIKEABLE and FUNNY — the viewer should enjoy both sides
 - Each response should be a SURPRISE — never predictable
 - Use specific details, not vague claims (say "I made two hundred thousand last Tuesday" not "I make a lot of money")
 - Humor mixed with real flex — funny but also impressive
 - The "winner" wins with something unexpected and clever, not just being louder
 - Escalation should feel natural — each claim slightly bigger than the last

PROVEN DEBATE MATCHUPS:
 - Police vs Drug Dealer (who knows the streets better)
 - Chef vs Grandma (who cooks better)
 - Doctor vs Google (who gives better diagnosis)
 - Teacher vs Student (who is actually smarter)
 - Rich Kid vs Self-Made (who has it harder)
 - Hacker vs FBI Agent (who is better at cyber)
 - Personal Trainer vs Dad Bod (who is actually healthier)
 - Pilot vs Uber Driver (who is the better driver)

LANGUAGE (CRITICAL — messages are read aloud by AI voice):
 - Use casual but PROPER English — full words, no abbreviations
 - NEVER use: "bro", "wdym", "nah", "lol", "omg", "rn", "im", "ur", "ngl", "imo", "tbh", "idk"
 - Sound like confident people TALKING — natural spoken English
 - No emojis in message text — they cannot be spoken
 - Punchy confident lines: "Please.", "That is cute.", "You done?", "Watch and learn.", "Not even close."

Return JSON ONLY, no prose, no code fences.

Schema: { "title": "...", "characterA": "...", "characterB": "...", "messages": [{ "sender": "a" | "b", "text": "..." }] }`;

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
