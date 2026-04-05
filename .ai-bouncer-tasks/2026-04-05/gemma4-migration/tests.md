# TC — Gemma 4 마이그레이션

| TC | 검증 항목 | 기대 결과 | 상태 |
|----|----------|----------|------|
| TC-01 | 정상 요약 요청 (한국어) | `{"summary": "...", "category": "맛집", "remaining": 2}` 형태 JSON 반환 | ✅ |
| TC-02 | category가 유효한 값인지 | CATEGORIES 목록 중 하나 (맛집/운동/꿀팁/제품/여행/음악/기타) | ✅ |
| TC-03 | x-device-id 헤더 없을 때 | 400 에러 반환 | ✅ |
| TC-04 | text 없을 때 | 400 에러 반환 | ✅ |

## 실행출력

TC-01, TC-02: `curl -X POST http://localhost:3001/api/summarize -H "x-device-id: test-device-001" -d '{"text": "오늘 강남에서 맛있는 라멘 먹었어요...", "lang": "ko"}'`
→ `{"summary":"강남의 진하고 쫄깃한 라멘 맛집 방문","category":"맛집","remaining":-1}`

TC-03: `curl` without `x-device-id`
→ `{"error":"x-device-id header is required."}`

TC-04: `curl` without `text`
→ `{"error":"text is required."}`
