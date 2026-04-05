import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { isPremiumUser } from "@/lib/revenuecat";
import { checkAndIncrement } from "@/lib/ratelimit";

const MAX_TEXT_LENGTH = 3000;
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
  const deviceId = req.headers.get("x-device-id");
  if (!deviceId) {
    return NextResponse.json(
      { error: "x-device-id header is required." },
      { status: 400 }
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

  // 구독 상태 확인 → 무료 유저면 일일 제한 체크
  const premium = await isPremiumUser(deviceId);
  let remaining: number = premium ? -1 : 0;

  if (!premium) {
    const result = await checkAndIncrement(deviceId);
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "daily_limit_exceeded",
          message: "오늘 무료 요약을 모두 사용했습니다.",
          remaining: 0,
        },
        { status: 429 }
      );
    }
    remaining = result.remaining;
  }

  const trimmedText = text.slice(0, MAX_TEXT_LENGTH);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

    const response = await ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: buildPrompt(trimmedText, lang),
      config: {
        maxOutputTokens: 200,
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";

    let summary: string;
    let category: string;

    try {
      const parsed = JSON.parse(text);
      summary = typeof parsed.summary === "string"
        ? parsed.summary.slice(0, 50)
        : trimmedText.slice(0, 50);
      category = CATEGORIES.includes(parsed.category)
        ? parsed.category
        : "기타";
    } catch {
      // JSON 파싱 실패 fallback
      summary = trimmedText.slice(0, 50);
      category = "기타";
    }

    return NextResponse.json({ summary, category, remaining });
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary." },
      { status: 500 }
    );
  }
}
