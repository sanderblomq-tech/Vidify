import Groq from "groq-sdk";
import type { RawChatScript, ChatMessage } from "./types.ts";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write SHORT, viral fake iMessage conversations for TikTok/YouTube Shorts.
You are an expert at writing conversations that get millions of views.

The conversation is between "me" (blue bubbles, right side) and "them" (grey bubbles, left side).
ALL conversations must be in ENGLISH.

CRITICAL — THE HOOK DECIDES EVERYTHING:
The first message MUST make someone stop scrolling INSTANTLY. It should feel urgent, scary, or shocking.
Message 1 from "them" should be something like:
 - "I know what you did."
 - "Check your front door. Now."
 - "I just saw your boyfriend with someone."
 - "Why did the school just call me?"
 - "Someone is in your house."
 - "I found the other phone."
 - "Do not open that package."
 - "Your mom just called me crying."
The viewer must think "WAIT WHAT" within 2 seconds.

STRUCTURE:
 - 15-25 messages total, alternating but not strictly (can send 2-3 in a row)
 - Max 8 words per message — SHORT and punchy
 - Act 1 (messages 1-3): INSTANT HOOK — drop the bomb immediately, no small talk, no "hey"
 - Act 2 (messages 4-15): ESCALATION — every single message must add new information or raise stakes. Never repeat the same beat twice.
 - Act 3 (last 3-5 messages): PAYOFF — a genuine plot twist the viewer did NOT see coming. The twist should reframe the entire conversation.

PROVEN VIRAL FORMULAS:
 - Someone is hiding something and slowly getting caught through contradictions
 - Wrong person gets a screenshot/message meant for someone else
 - Unknown number knows way too much about you — gets creepier each message
 - Catching someone in a lie — they dig deeper and deeper
 - "Do not go outside" / "Do not look behind you" — creepy escalation
 - Friend needs an alibi but the reason keeps getting worse
 - Finding evidence of cheating through innocent questions
 - The twist reveals the ENTIRE conversation meant something different

LANGUAGE (THIS IS CRITICAL — messages are read aloud by AI voice):
 - Use casual but PROPER English — full words, no abbreviations
 - NEVER use: "bro", "wdym", "nah", "lol", "omg", "rn", "im", "ur", "ngl", "imo", "tbh"
 - INSTEAD use: "Wait what?", "Are you serious?", "That makes no sense", "Since when?", "Explain. Now."
 - Sound like a young person TALKING, not texting — natural spoken English
 - No emojis in message text — they cannot be spoken
 - Short punchy replies build tension: "What?", "No.", "Explain.", "Since when?", "That was you?"

 - contactName should be dramatic with 1-2 emojis (e.g. "Emma 💀", "Mom 😭", "Ex 🚩", "Unknown 👀")
 - Return JSON ONLY, no prose, no code fences

Schema: { "contactName": "...", "messages": [{ "sender": "me" | "them", "text": "..." }] }`;

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
    typeof parsed.contactName !== "string" ||
    !Array.isArray(parsed.messages) ||
    parsed.messages.length === 0
  ) {
    throw new Error("Script JSON missing 'contactName' or 'messages' array");
  }

  for (const msg of parsed.messages) {
    if (
      typeof msg.sender !== "string" ||
      (msg.sender !== "me" && msg.sender !== "them") ||
      typeof msg.text !== "string" ||
      msg.text.trim().length === 0
    ) {
      throw new Error(`Invalid message in script: ${JSON.stringify(msg)}`);
    }
  }

  return {
    contactName: parsed.contactName,
    messages: parsed.messages.map((m: ChatMessage) => ({
      sender: m.sender,
      text: m.text.trim(),
    })),
  };
}

/**
 * Ask Groq to pick N viral topics for fake iMessage conversations.
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
        content: `You pick trending, funny, dramatic scenarios for fake iMessage conversations on TikTok.
Think: awkward situations, relationship drama, friend group chaos, family texts, work drama.
Return JSON ONLY: { "topics": ["topic1", "topic2", ...] }`,
      },
      {
        role: "user",
        content: `Pick ${count} completely different topics. Make them dramatic, funny, and relatable. Keep each topic under 8 words.`,
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
 * Generate a fake iMessage conversation from a topic.
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
