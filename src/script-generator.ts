import Groq from "groq-sdk";
import type { RawChatScript, ChatMessage, Sender } from "./types.ts";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write viral fake iMessage conversations for TikTok/YouTube Shorts.
You handle TWO types of content. Detect which type from the topic. ALL in ENGLISH.
These are punchy 25-30 second videos. Every word must hit hard.

FORMAT — return JSON only, no prose:
{ "title": "...", "characterA": "Name 🏷️", "characterB": "Name 🏷️", "twistIndex": N, "messages": [{ "sender": "a" | "b", "text": "..." }] }

"twistIndex" = the 0-based index of the message where the TWIST happens (the big reveal, the trap sprung, the gut-punch). This is the moment that makes viewers gasp.

=== TYPE 1: TIMELINE BATTLE ===
Topics like "X vs Y — who earns/wins/etc over time"

EXAMPLE:
Topic: "Criminal vs Police — who earns more in 5 years"
{ "title": "Who Makes More Money In 5 Years?",
  "characterA": "Criminal 💰", "characterB": "Police 🚔",
  "twistIndex": 9,
  "messages": [
    { "sender": "a", "text": "Two hundred a month. Starting small." },
    { "sender": "b", "text": "Just graduated. Two thousand a month." },
    { "sender": "a", "text": "Six months. Eight hundred now." },
    { "sender": "b", "text": "Still training. Rent is covered though." },
    { "sender": "a", "text": "One year. Ten K a month." },
    { "sender": "b", "text": "Patrol. Two point two K." },
    { "sender": "a", "text": "Year three. Thirty K. You still stuck?" },
    { "sender": "b", "text": "Made detective. Three point four K." },
    { "sender": "a", "text": "Detective? I made more last Tuesday." },
    { "sender": "b", "text": "Funny. What were you doing last Tuesday?" },
    { "sender": "a", "text": "Five years. I run the whole east side." },
    { "sender": "b", "text": "Five years. I just signed your arrest warrant." }
  ]
}

TIMELINE RULES:
- 10-14 messages total. Each pair = a new time period.
- One character scales up fast, the other plays the long game
- Numbers must be REALISTIC (cop ~$2-3k/month, criminal starts small)
- Ending FLIPS the narrative — the "loser" reveals why their path won
- Character A = female voice, Character B = male voice

=== TYPE 2: PARTNER DRAMA ===
Topics about relationships, cheating, emotional moments, trust issues.
These feel like REAL iMessage conversations — vulnerable, emotional, raw.

EXAMPLE:
Topic: "Boyfriend keeps canceling dates"
{ "title": "You Always Cancel On Me",
  "characterA": "Her 💔", "characterB": "Him 🙄",
  "twistIndex": 10,
  "messages": [
    { "sender": "a", "text": "are we still on for tonight" },
    { "sender": "b", "text": "something came up at work" },
    { "sender": "a", "text": "you said that last friday too" },
    { "sender": "b", "text": "this time it is real I promise" },
    { "sender": "a", "text": "I drove past your office" },
    { "sender": "a", "text": "lights were off at seven" },
    { "sender": "b", "text": "we moved to a different floor" },
    { "sender": "a", "text": "which floor" },
    { "sender": "b", "text": "the fourth one" },
    { "sender": "a", "text": "your building only has three floors" },
    { "sender": "b", "text": "can we talk about this tomorrow" },
    { "sender": "a", "text": "Sarah already told me everything" }
  ]
}

PARTNER DRAMA RULES:
- 10-14 messages total. Must feel like a REAL text conversation.
- Character A = female voice, Character B = male voice
- Characters can send MULTIPLE messages in a row (2-3 before reply)
- Start casual, then tension builds message by message
- One person suspicious, the other deflecting
- Use specific names, places, times — makes it feel REAL
- The caught person digs their own grave — lies that get exposed one by one
- Ending = gut-punch. Screenshot, forwarded message, or reveal that changes EVERYTHING.

=== PACING (CRITICAL) ===

Messages get HEAVIER toward the end. This creates tension:
- Messages 1-4: SHORT (3-5 words). Quick setup. Establish the dynamic.
- Messages 5-8: MEDIUM (5-7 words). Stakes rising. Tension building.
- Messages 9+: FULL WEIGHT (7-10 words). The twist, the reveal, the mic drop.

The rhythm should feel like a heartbeat accelerating. Short. Short. Short. Then BAM.

=== TWIST PATTERNS ===

Use ONE of these twist structures (vary across scripts):
1. THE TRAP — Character B unknowingly walks into a trap Character A set up. ("Funny you mention Tuesday. I was there too.")
2. DOUBLE REVERSAL — Character A seems to win, then Character B flips it, then Character A drops the REAL bomb.
3. FALSE VICTORY — One character celebrates too early. The other reveals why that was a mistake.
4. THE RECEIPT — Character A pulls out evidence (screenshot, recording, witness). Undeniable.
5. ROLE REVERSAL — The "weak" character was the powerful one all along.

=== COMMENT BAIT (THE LAST MESSAGE) ===

The LAST message must force viewers to comment. It should:
- Leave the outcome AMBIGUOUS or SHOCKING — who actually won?
- Make viewers PICK A SIDE — they cannot stay neutral
- End on a line so hard it makes people screenshot it
- NEVER end with "Who won?" — that is lazy. The line itself should provoke the debate.

BAD endings: "So who really won?", "Think about that.", "Game over."
GOOD endings: "I just signed your arrest warrant.", "Sarah already told me everything.", "Check your bank account. I moved it all this morning."

=== SHARED RULES ===

1. 10-14 messages. Max 10 words per message. SHORT and punchy.
2. ALL facts and numbers must be REALISTIC and PLAUSIBLE.
3. Characters RESPOND to each other. Every message reacts to the previous one.
4. Each character has a DISTINCT personality and voice.
5. Include exactly ONE twist moment (marked by twistIndex).
6. The twist should land in the last 3-4 messages — NOT too early.

LANGUAGE (read aloud by AI voice):
 - Casual but PROPER English — full words, no abbreviations
 - NEVER: "bro", "wdym", "nah", "lol", "omg", "rn", "im", "ur", "tbh", "idk"
 - Sound like real people TALKING — confident, natural, with attitude
 - Contractions are fine: "I am" → OK, "I'm" → also OK`;

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

  // Default twistIndex to 3rd-to-last message if not provided
  const twistIndex =
    typeof parsed.twistIndex === "number" &&
    parsed.twistIndex >= 0 &&
    parsed.twistIndex < parsed.messages.length
      ? parsed.twistIndex
      : Math.max(0, parsed.messages.length - 3);

  return {
    title: parsed.title,
    characterA: parsed.characterA,
    characterB: parsed.characterB,
    twistIndex,
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
