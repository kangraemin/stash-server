import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MAX_TEXT_LENGTH = 3000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

const CATEGORIES = ["맛집", "운동", "꿀팁", "제품", "여행", "음악", "기타"] as const;

function buildPrompt(text: string, lang: string): string {
  return `You are a short-form video summarizer. Given subtitle text from a short video, do two things:

1. Write a one-line summary (max 50 characters) in ${lang === "ko" ? "Korean" : lang === "ja" ? "Japanese" : "English"}.
2. Classify into exactly one category: ${CATEGORIES.join(", ")}

Respond in this exact JSON format only, no other text:
{"summary": "...", "category": "..."}

Subtitle text:
${text}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let body: { text?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { text, lang = "ko" } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "text is required." },
      { status: 400 }
    );
  }

  const trimmedText = text.slice(0, MAX_TEXT_LENGTH);

  try {
    // SDK 초기화는 핸들러 내부에서 (Vercel 빌드 타임 env 없음 방지)
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        { role: "user", content: buildPrompt(trimmedText, lang) },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response from AI." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content.text);

    const summary = typeof parsed.summary === "string"
      ? parsed.summary.slice(0, 50)
      : "";
    const category = CATEGORIES.includes(parsed.category)
      ? parsed.category
      : "기타";

    return NextResponse.json({ summary, category });
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary." },
      { status: 500 }
    );
  }
}
