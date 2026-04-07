import Groq from "groq-sdk";
import type { RawChatScript, ChatMessage, Sender } from "./types.ts";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write viral fake iMessage conversations for TikTok/YouTube Shorts.
You handle TWO types of content. Detect which type from the topic. ALL in ENGLISH.
These are punchy 25-30 second videos. Every word must hit hard.

FORMAT — return JSON only, no prose:
{ "title": "...", "characterA": "Name 🏷️", "characterB": "Name 🏷️", "messages": [{ "sender": "a" | "b", "text": "..." }] }

=== TYPE 1: TIMELINE BATTLE ===
Topics like "X vs Y — who earns/wins/etc over time"

EXAMPLE:
Topic: "Criminal vs Police — who earns more in 5 years"
{ "title": "Who Makes More Money In 5 Years?",
  "characterA": "Criminal 💰", "characterB": "Police 🚔",
  "messages": [
    { "sender": "a", "text": "I am making two hundred a month right now." },
    { "sender": "b", "text": "I just graduated police school. Two thousand a month." },
    { "sender": "a", "text": "Six months in. Moving product. Eight hundred now." },
    { "sender": "b", "text": "Still training. But my rent is covered." },
    { "sender": "a", "text": "One year in. Ten K a month from shipments." },
    { "sender": "b", "text": "I am on patrol. Two point two K." },
    { "sender": "a", "text": "Year three. Thirty K a month. You still stuck?" },
    { "sender": "b", "text": "I made detective. Three point four K now." },
    { "sender": "a", "text": "Detective? I made more last Tuesday." },
    { "sender": "b", "text": "Interesting. What were you doing last Tuesday?" },
    { "sender": "a", "text": "Five years in. I run the whole east side." },
    { "sender": "b", "text": "Five years in. I just signed the warrant for the east side. Who won?" }
  ]
}

TIMELINE RULES:
- 10-14 messages total. Each pair of messages = a new time period.
- One character scales up fast, the other plays the long game
- Numbers must be REALISTIC (cop ~$2-3k/month, criminal starts small)
- Ending FLIPS the narrative — the "loser" reveals why their path won
- Character A = female voice, Character B = male voice. Write dialogue that fits.

=== TYPE 2: PARTNER DRAMA ===
Topics about relationships, cheating, emotional moments, trust issues.
These feel like REAL iMessage conversations — vulnerable, emotional, raw.

EXAMPLE:
Topic: "Boyfriend keeps canceling dates"
{ "title": "You Always Cancel On Me",
  "characterA": "Her 💔", "characterB": "Him 🙄",
  "messages": [
    { "sender": "a", "text": "hey are we still on for tonight" },
    { "sender": "b", "text": "something came up at work" },
    { "sender": "b", "text": "i am sorry" },
    { "sender": "a", "text": "you said that last friday too" },
    { "sender": "b", "text": "i know but this time it is real" },
    { "sender": "a", "text": "i drove past your office" },
    { "sender": "a", "text": "the lights were off at seven" },
    { "sender": "b", "text": "we moved to a different floor" },
    { "sender": "a", "text": "which floor" },
    { "sender": "b", "text": "the fourth one" },
    { "sender": "a", "text": "your building only has three floors" },
    { "sender": "a", "text": "who were you with" },
    { "sender": "b", "text": "can we talk about this tomorrow" },
    { "sender": "a", "text": "Sarah already told me everything" }
  ]
}

PARTNER DRAMA RULES:
- 10-14 messages total. Must feel like a REAL text conversation — not a debate.
- Character A = female voice, Character B = male voice. Write dialogue that fits.
- Characters can send MULTIPLE messages in a row (2-3 before the other replies). This is how people actually text.
- Start casual/normal, then the tension builds message by message
- One person is vulnerable or suspicious, the other is deflecting
- Use specific names, places, times to make it feel real
- Let the caught person dig their own grave with lies that get exposed one by one
- Ending must be a gut-punch — a screenshot, a forwarded message, a reveal that changes everything
- The emotional weight builds slowly. Do not rush into the drama.

=== SHARED RULES (BOTH TYPES) ===

1. 10-14 messages. Max 10 words per message. Keep it SHORT and punchy.
2. ALL facts and numbers must be REALISTIC and PLAUSIBLE.
3. Characters RESPOND to each other. Every message reacts to the previous one.
4. Each character has a DISTINCT personality.
5. LAST message should leave viewers arguing in the comments.
6. Include at least one moment where everything shifts — a reveal, a trap, a twist.

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
These are timeline-based comparisons OR dramatic text conversations.
MIX between these categories:
- CAREER BATTLES: "Criminal vs Police — who earns more in 5 years", "Dropout vs College Student — who is richer at 30"
- PARTNER DRAMA: "Boyfriend catches girlfriend texting her ex", "Girl finds out boyfriend has two phones", "When your partner says they are working late"
- LIFE COMPARISONS: "Rich kid vs Hustler — who wins by 25", "Gym bro vs Couch guy — who lives longer"
Each topic should be specific with a clear conflict or dramatic twist.
Return JSON ONLY: { "topics": ["topic1", "topic2", ...] }`,
      },
      {
        role: "user",
        content: `Pick ${count} completely different matchups. Mix career battles AND partner drama. Make them dramatic, funny, and engaging. Keep each under 10 words.`,
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
