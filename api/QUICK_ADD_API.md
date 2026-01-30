# ONCE Quick-Add API

외부 스크립트나 도구에서 ONCE 개인 공간에 노트 또는 Todo를 추가할 수 있는 API입니다.
**인증 없이** 사용 가능하며, `loginid`로 사용자를 식별합니다.

> ⚠️ 사내망에서만 접근 가능합니다. 사용자는 SSO 로그인 이력이 있어야 합니다.

---

## 1. 노트 추가

메모/회의록 등을 입력하면 AI가 자동으로 정리하여 개인 공간에 저장합니다.

### Request

```
POST /quick-add
Content-Type: application/json
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | string | ✅ | SSO 사번 (loginid) |
| `input` | string | ✅ | 정리할 내용 (최대 100,000자) |

### Example

```bash
curl -X POST http://a2g.samsungds.net:16001/api/quick-add \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hong.gildong",
    "input": "오늘 회의에서 결정된 사항: 1) 예산 20% 증액 2) 3월 킥오프"
  }'
```

### Response (201)

```json
{
  "request": {
    "id": "clx...",
    "status": "PENDING",
    "position": 1,
    "createdAt": "2026-01-30T04:00:00.000Z"
  },
  "message": "입력이 접수되었습니다. 잠시 후 AI가 정리해드립니다."
}
```

### Errors

| Status | 설명 |
|--------|------|
| 400 | `id` 또는 `input` 누락, 또는 100,000자 초과 |
| 404 | 해당 loginid의 사용자 또는 개인 공간이 없음 |
| 500 | 서버 에러 |

---

## 2. Todo 추가

개인 공간에 할일(Todo)을 직접 추가합니다.

### Request

```
POST /quick-add/todo
Content-Type: application/json
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | string | ✅ | SSO 사번 (loginid) |
| `title` | string | ✅ | Todo 제목 |
| `content` | string | | 상세 내용 |
| `startDate` | string | | 시작일 `YYYY-MM-DD` (기본: 오늘) |
| `endDate` | string | | 종료일 `YYYY-MM-DD` (기본: 1년 후) |

### Example

```bash
curl -X POST http://a2g.samsungds.net:16001/api/quick-add/todo \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hong.gildong",
    "title": "보고서 제출",
    "endDate": "2026-02-28"
  }'
```

### Response (201)

```json
{
  "todo": {
    "id": "clx...",
    "title": "보고서 제출",
    "startDate": "2026-01-30T00:00:00.000Z",
    "endDate": "2026-02-28T00:00:00.000Z",
    "completed": false,
    "createdAt": "2026-01-30T04:00:00.000Z"
  },
  "message": "Todo가 추가되었습니다."
}
```

### Errors

| Status | 설명 |
|--------|------|
| 400 | `id` 또는 `title` 누락, 날짜 형식 오류, endDate < startDate |
| 404 | 해당 loginid의 사용자 또는 개인 공간이 없음 |
| 500 | 서버 에러 |

---

## 활용 예시

```bash
# CI/CD 빌드 결과 자동 저장
curl -X POST http://a2g.samsungds.net:16001/api/quick-add \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"syngha.han\", \"input\": \"빌드 #${BUILD_NUMBER} 성공. 커밋: ${GIT_COMMIT}\"}"

# 자동 Todo 등록
curl -X POST http://a2g.samsungds.net:16001/api/quick-add/todo \
  -H "Content-Type: application/json" \
  -d '{"id": "syngha.han", "title": "코드 리뷰 완료하기", "endDate": "2026-02-07"}'

# 슬랙 봇에서 메시지 전달
curl -X POST http://a2g.samsungds.net:16001/api/quick-add \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"${SLACK_USER_ID}\", \"input\": \"${MESSAGE_TEXT}\"}"
```

---

## 주의사항

- 인증 없이 사용 가능하므로 **사내망에서만** 접근 가능
- `id`에 해당하는 사용자가 존재해야 합니다 (SSO 로그인 이력 필요)
- **개인 공간**에만 저장됩니다 (팀 공간 불가)
- 노트 추가는 비동기 처리되며, 큐에 등록 후 AI가 순차적으로 처리합니다
- Todo 추가는 즉시 생성됩니다
