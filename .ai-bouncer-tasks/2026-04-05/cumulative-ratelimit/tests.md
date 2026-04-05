# TC — 누적 rate limit

| TC | 검증 항목 | 기대 결과 | 상태 |
|----|----------|----------|------|
| TC-01 | 첫 요청 시 remaining | 99 반환 (100 - 1) | ✅ |
| TC-02 | 같은 device_id로 재요청 | remaining 감소 (98) | ✅ |
| TC-03 | x-device-id 없을 때 | 400 에러 | ✅ |

## 실행출력

TC-01: `curl -H "x-device-id: tc-fresh-xxx" ... "text": "오늘 강남에서 맛있는 라멘 먹었어요"`
→ `{"summary":"강남 라멘 맛집 방문 후기","category":"맛집","remaining":99}`

TC-02: 동일 device-id 재요청
→ `{"summary":"강남 라멘 맛집 방문 후기","category":"맛집","remaining":98}`

TC-03: x-device-id 헤더 없음
→ `{"error":"x-device-id header is required."}`
