# Gemma 4 마이그레이션 계획

## Context
현재 `claude-haiku-4-5-20251001` (유료) → `gemma-4-31b-it` (Google AI Studio 무료)로 전환.
비용 절감이 목적. 로직(rate limit, RevenueCat)은 그대로 유지.

## 변경 파일

### 1. `package.json`

**Before:**
```json
"@anthropic-ai/sdk": "^0.82.0"
```

**After:**
```json
"@google/genai": "^1.0.0"
```

### 2. `app/api/summarize/route.ts`

**Before:**
```typescript
import Anthropic from "@anthropic-ai/sdk";
...
const anthropic = new Anthropic();
const message = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 200,
  temperature: 0,
  messages: [{ role: "user", content: buildPrompt(trimmedText, lang) }],
});
const content = message.content[0];
if (content.type !== "text") { ... }
// JSON.parse(content.text)
```

**After:**
```typescript
import { GoogleGenAI } from "@google/genai";
...
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
const text = response.text;
// JSON.parse(text)
```

`buildPrompt` 함수 자체는 변경 없음. JSON format instruction 프롬프트도 그대로 유지.
`responseMimeType: "application/json"` 덕분에 JSON 파싱 실패 케이스가 줄어듦.

### 환경변수
- `ANTHROPIC_API_KEY` → `GOOGLE_API_KEY` (Vercel 환경변수 교체 필요 — 코드 외 작업)

## 검증 방법
```bash
GOOGLE_API_KEY=xxx npm run dev

curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -H "x-device-id: test-device" \
  -d '{"text": "오늘 강남에서 맛있는 라멘 먹었어요", "lang": "ko"}'
```
