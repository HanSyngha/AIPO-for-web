# ONCE - 요구사항 명세서

> **버전**: 1.2.0
> **작성일**: 2026-01-28
> **서비스명**: ONCE
> **호스팅**: a2g.samsungds.net
> **상태**: 최종 검토 완료
> **관련 코드베이스**: ~/Dashboard (이 문서가 위치한 monorepo)
> **개발자**: syngha.han
> **문의/피드백**: Dashboard Feedback (`https://a2g.samsungds.net/feedback`)

---

## 1. 프로젝트 개요

### 1.1 서비스 목적
> **"작성하기 귀찮을 때 쓰는 지식 공유 서비스"**

아이디어, 회의록, 메모, 공유하고 싶은 지식 등을 **직접 정리하지 않고** 그냥 입력만 하면 AI가 알아서 정리해주는 서비스입니다.

**사용 시나리오**:
- 📝 회의 중 메모한 내용을 그대로 붙여넣기만 하면 AI가 정리
- 💡 아이디어가 떠올랐을 때 두서없이 입력해도 AI가 구조화
- 📚 공유하고 싶은 지식을 형식 맞추지 않고 입력하면 AI가 문서화
- 🔍 "지난주 회의에서 뭐라고 했더라?" 자연어로 검색하면 AI가 찾아줌

### 1.2 핵심 컨셉
**LLM 기반 자동 노트 정리 서비스**
- 사용자가 아무 내용이나 입력하면 LLM이 자동으로 폴더/파일 구조를 결정하고 저장
- **⚠️ 사용자 직접 편집 불가** - 모든 노트 내용 추가/수정은 LLM을 통해서만 가능
- 개인 노트와 팀 공유 노트 분리 (사업부-팀-개인 3계층 구조)
- 자연어 기반 검색 (LLM Agent가 트리 탐색)

### 1.3 주요 기능
| 기능 | 설명 |
|------|------|
| 뭐든지 입력 | 아무 정보나 입력하면 LLM이 자동 분류/저장 |
| 뭐든지 검색 | 자연어로 검색하면 LLM이 관련 노트 ranking |
| 노트 트리 | 사이드바에서 전체 폴더/파일 구조 확인 |
| 다국어 지원 | 한국어/영어/중국어 3개 언어로 자동 생성 |
| 블록 댓글 | 블록 단위 쓰레드 토론 |
| 링크 공유 | SSO 로그인 필수 공유 링크 |

### 1.4 브랜딩
- **서비스명**: ONCE
- **기존 AIPO**: "AIPO for Desktop"으로 명칭 변경
- **문서 위치**: Dashboard docs-site에 "ONCE" 가이드 추가
  - 서비스 목적 ("작성하기 귀찮을 때 쓰는 지식 공유 서비스") 명시
  - 사용 시나리오 예시 포함
  - **⚠️ 사용자 직접 편집 불가** 안내 필수

### 1.5 관련 코드베이스
- **Dashboard**: `~/Dashboard` (본 monorepo)
  - ONCE는 `~/Dashboard/packages/once`에 위치
  - Dashboard API 연동 필요 (사용량 추적, LLM Proxy)
  - **수정 범위**: docs-site에 ONCE 가이드만 추가 (다른 Dashboard 코드는 수정하지 않음)

---

## 2. 기술 스택

### 2.1 Frontend
| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | React | 18+ |
| Build Tool | Vite | 5+ |
| 상태 관리 | Zustand | 4+ |
| HTTP Client | Axios | 1+ |
| 스타일링 | Tailwind CSS | 3+ |
| 블록 에디터 | Tiptap / BlockNote | latest |
| 아이콘 | Lucide React | latest |
| WebSocket | Socket.io-client | 4+ |
| E2E 테스트 | Playwright | latest |

### 2.2 Backend
| 항목 | 기술 | 버전 |
|------|------|------|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4+ |
| ORM | Prisma | 5+ |
| 인증 | JWT (SSO 연동) | - |
| 큐 시스템 | Bull (Redis 기반) | 4+ |
| WebSocket | Socket.io | 4+ |
| API 문서 | Swagger/OpenAPI | 3.0 |

### 2.3 Infrastructure
| 항목 | 기술 | 포트 |
|------|------|------|
| Frontend | Nginx + React | **16001** |
| API Server | Node.js | **16002** |
| Database | PostgreSQL 15+ | **16003** |
| Cache/Queue | Redis 7+ | **16004** |

### 2.4 외부 연동
| 서비스 | URL | 용도 |
|--------|-----|------|
| Dashboard LLM Proxy | (기존 설정) | LLM API 호출 |
| Knox Mail API | genai.samsungds.net:20080 | 메일 알림 발송 |
| Dashboard API | (기존 설정) | 사용량 통계 연동 |

---

## 3. Docker 설정

### 3.1 Proxy 설정 (필수)
```dockerfile
# Dockerfile에 반드시 포함
ENV HTTP_PROXY=http://12.26.204.100:8000
ENV HTTPS_PROXY=http://12.26.204.100:8000
ENV http_proxy=http://12.26.204.100:8000
ENV https_proxy=http://12.26.204.100:8000
ENV NO_PROXY=localhost,127.0.0.1,genai.samsungds.net
```

### 3.2 포트 충돌 주의
- Dashboard 포트와 절대 겹치지 않도록 **16000번대** 사용
- Dashboard 포트: 3000(FE), 3400(API), 5432(DB), 6379(Redis)

### 3.3 환경변수 목록
```env
# 필수
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:16003/once_notes
REDIS_URL=redis://localhost:16004
JWT_SECRET=your-secret-key
DEVELOPERS=syngha.han

# LLM 연동
LLM_PROXY_URL=http://dashboard-api:3400/api/llm
LLM_SERVICE_ID=once-notes

# Knox Mail
KNOX_MAIL_URL=http://genai.samsungds.net:20080/knox/mail/send

# 기타
BACKUP_PATH=/backups
```

---

## 4. 보안

### 4.1 인증
| 항목 | 설정 |
|------|------|
| 방식 | SSO 로그인 전용 (JWT) |
| 세션 만료 | **24시간** |
| 토큰 갱신 | 만료 1시간 전 자동 갱신 |
| 저장 위치 | localStorage |

### 4.2 Rate Limiting
| 엔드포인트 | 제한 |
|------------|------|
| 뭐든지 입력 (POST /requests/input) | **분당 5회** |
| 뭐든지 검색 (POST /requests/search) | **분당 10회** |
| 일반 API | 제한 없음 |

### 4.3 감사 로그 (Audit Log)
```typescript
interface AuditLog {
  id: string;
  userId: string;
  loginid: string;
  action: AuditAction;
  targetType: 'FILE' | 'FOLDER' | 'COMMENT' | 'TEAM' | 'USER';
  targetId: string;
  details: Record<string, any>;  // 변경 내용
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  spaceId: string;  // 팀 관리자가 조회 가능하도록
}

enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE_NOTE = 'CREATE_NOTE',
  UPDATE_NOTE = 'UPDATE_NOTE',
  DELETE_NOTE = 'DELETE_NOTE',
  MOVE_NOTE = 'MOVE_NOTE',
  CREATE_FOLDER = 'CREATE_FOLDER',
  DELETE_FOLDER = 'DELETE_FOLDER',
  CREATE_COMMENT = 'CREATE_COMMENT',
  DELETE_COMMENT = 'DELETE_COMMENT',
  RESTORE_FROM_TRASH = 'RESTORE_FROM_TRASH',
  PERMANENT_DELETE = 'PERMANENT_DELETE',
  REFACTOR_STRUCTURE = 'REFACTOR_STRUCTURE',
}
```

**접근 권한**:
- Super Admin: 전체 로그 조회 가능
- Team Admin: 해당 팀 로그만 조회 가능
- 일반 사용자: 본인 활동 로그만 조회 가능

---

## 5. 인증 시스템

### 5.1 SSO 로그인 플로우 (Dashboard와 동일)
```
┌─────────────────────────────────────────────────────────┐
│                    SSO 인증 플로우                        │
├─────────────────────────────────────────────────────────┤
│  1. 사용자 → SSO 로그인 페이지                            │
│  2. SSO → JWT 토큰 발급 (loginid, deptname, username)    │
│  3. Frontend → API /auth/login 호출                      │
│  4. API → 사용자 DB upsert + 세션 토큰 발급               │
│  5. Frontend → 세션 토큰 저장 (localStorage)              │
│  6. 24시간 후 만료 → 재로그인 필요                        │
└─────────────────────────────────────────────────────────┘
```

### 5.2 사용자 정보 (SSO에서 추출)
| 필드 | 설명 | 예시 |
|------|------|------|
| loginid | 사용자 고유 ID | syngha.han |
| username | 사용자 이름 | 한승하 |
| deptname | 부서명 | AI플랫폼팀(DS부문) |
| businessUnit | 사업부 (자동 추출) | DS부문 |

### 5.3 권한 체계
| 역할 | 설명 | 권한 |
|------|------|------|
| Super Admin | 시스템 전체 관리자 | 모든 기능 + 모든 팀 접근 + 관리자 지정 |
| Team Admin | 팀 관리자 | 팀 폴더 구조 refactoring + 팀 감사 로그 조회 |
| User | 일반 사용자 | 노트 입력/검색/조회 + 본인 활동 로그 조회 |

### 5.4 초기 설정
- **Super Admin**: `syngha.han` (환경변수 `DEVELOPERS`로 설정)
- Dashboard와 동일한 방식

---

## 6. 사용자/팀 구조 (3계층: 사업부-팀-개인)

### 6.1 조직 계층 구조
```
┌─────────────────────────────────────────────────────────────────┐
│                    조직 계층 구조                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  사업부 (BusinessUnit) ─┬─ 팀 (Team) ─── 팀 공유 노트           │
│         DS부문          │   AI플랫폼팀                          │
│                        │                                       │
│                        └─ 팀 (Team) ─── 팀 공유 노트           │
│                            반도체설계팀                         │
│                                                                 │
│  개인 (Personal) ─────────────────────── 개인 노트              │
│                                                                 │
│  ※ 사업부는 통계/분류 용도, 팀은 공유 단위, 개인은 비공개       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 조직도 기반 자동 팀 생성 (Dashboard 로직 참조)
```typescript
/**
 * Dashboard proxy.routes.ts의 extractBusinessUnit 함수와 동일
 * deptname 형식: "팀이름(사업부)" 또는 "사업부/팀이름"
 */
function extractBusinessUnit(deptname: string): string {
  if (!deptname) return '';
  // 형식 1: "AI플랫폼팀(DS부문)" → "DS부문"
  const match = deptname.match(/\(([^)]+)\)/);
  if (match) return match[1];
  // 형식 2: "DS부문/AI플랫폼팀" → "DS부문"
  const parts = deptname.split('/');
  return parts[0]?.trim() || '';
}

function extractTeamName(deptname: string): string {
  if (!deptname) return '';
  // 형식 1: "AI플랫폼팀(DS부문)" → "AI플랫폼팀"
  const match = deptname.match(/^([^(]+)/);
  if (match) return match[1].trim();
  // 형식 2: "DS부문/AI플랫폼팀" → "AI플랫폼팀"
  const parts = deptname.split('/');
  return parts[parts.length - 1]?.trim() || deptname;
}

// 예시:
// deptname: "AI플랫폼팀(DS부문)"
//   → teamName: "AI플랫폼팀"
//   → businessUnit: "DS부문"
// deptname: "DS부문/AI플랫폼팀"
//   → teamName: "AI플랫폼팀"
//   → businessUnit: "DS부문"
```

### 6.3 팀 매칭 로직
```
1. SSO 로그인 시 deptname에서 팀명/사업부 추출
2. 기존 팀이 있으면 해당 팀에 자동 가입 (TeamMember 생성)
3. 없으면 새 팀 자동 생성 후 가입
4. 사업부 정보는 User.businessUnit에 저장 (통계용)
```

### 6.4 공간 생성 시점
| 공간 | 생성 시점 | 초기 상태 |
|------|----------|----------|
| 개인 노트 | 사용자 첫 로그인 시 | 빈 공간 + 온보딩 가이드 |
| 팀 노트 | 해당 팀의 첫 사용자 로그인 시 | 빈 공간 + 온보딩 가이드 |

### 6.5 팀 변경 시 처리
- 사용자가 팀을 옮겨도 **기존 팀의 노트는 그대로 유지**
- 새 팀에서는 새로 시작

### 6.6 권한 매트릭스
| 역할 | 개인 노트 | 본인 팀 노트 | 다른 팀 노트 (같은 사업부) | 다른 사업부 팀 노트 |
|------|----------|-------------|--------------------------|-------------------|
| User | 전체 | 전체 | ❌ | ❌ |
| Team Admin | 전체 | 전체 + Refactoring | ❌ | ❌ |
| Super Admin | 전체 | 전체 + Refactoring | 조회/검색 가능 | 조회/검색 가능 |

---

## 7. LLM Agentic 노트 시스템

### 7.1 핵심 원칙
> **사용자는 절대로 직접 노트 내용을 편집하지 않음**
> **모든 노트 생성/수정은 LLM Agent가 도구를 사용하여 처리**
> **모든 요청은 "뭐든지 입력"을 통해서만 가능**

### 7.2 LLM Agent 도구 (Tools) - 전체 목록

#### 7.2.1 폴더 관련
| 도구 | 설명 | 파라미터 |
|------|------|----------|
| `add_folder` | 새 폴더 생성 | `path`: 폴더 경로 |
| `undo_add_folder` | 폴더 생성 취소 | `path`: 폴더 경로 |
| `edit_folder_name` | 폴더 이름 변경 | `path`, `newName` |

#### 7.2.2 파일 관련
| 도구 | 설명 | 파라미터 |
|------|------|----------|
| `add_file` | 새 파일 생성 | `path`, `content` |
| `undo_add_file` | 파일 생성 취소 | `path` |
| `read_file` | 파일 내용 읽기 | `path` |
| `edit_file` | 파일 내용 수정 | `path`, `before`, `after` |
| `edit_file_name` | 파일 이름 변경 | `path`, `newName` |
| `move_file` | 파일 이동 | `fromPath`, `toPath` |

#### 7.2.3 완료
| 도구 | 설명 | 파라미터 |
|------|------|----------|
| `complete` | 작업 완료 선언 | `summary`: 수행 작업 요약 |

### 7.3 edit_file 도구 상세 (동시성 제어)
```typescript
interface EditFileParams {
  path: string;      // 파일 경로
  before: string;    // 기존 내용 (일치 검증용)
  after: string;     // 변경할 내용
}

// 동작:
// 1. 해당 파일의 실제 내용과 before 비교
// 2. 일치하지 않으면 ERROR 반환 → LLM이 다시 read_file 후 재시도
// 3. 일치하면 after로 내용 교체
// 4. History에 이전 내용 저장
```

### 7.4 LLM 제한 설정
| 항목 | 설정 | 초과 시 처리 |
|------|------|-------------|
| 최대 반복 횟수 | **100회** | 강제 종료 + Knox Mail 알림 + 재시도 버튼 |
| 토큰 80% 임계치 | **max_tokens의 80%** | 마무리 모드 진입 (아래 상세) |
| 컨텍스트 초과 | 트리 요약 전송 | 폴더명/파일명만 전송, 필요시 read_file |

### 7.5 토큰 관리 및 Agentic History 유지 (⚠️ 핵심)

#### 7.5.1 Agentic 동작의 History 유지
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ 중요: Agentic 동작 시 매 iteration마다 전체 history 유지     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  매 LLM 호출 시 messages에 포함해야 하는 항목:                    │
│                                                                 │
│  1. System Prompt (도구 정의, 규칙, 현재 상태)                   │
│  2. 사용자 원본 입력                                             │
│  3. 이전 모든 iteration의:                                       │
│     - Assistant의 tool_call 요청 (function name + arguments)    │
│     - Tool의 응답 결과 (성공/실패 + 반환값)                      │
│     - Assistant의 다음 판단 (reasoning)                         │
│                                                                 │
│  ※ History를 유지하지 않으면 LLM이 이전 작업을 기억하지 못함      │
│  ※ 이전에 add_file한 파일을 다시 add_file 시도하는 등 오류 발생   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.5.2 History 메시지 구조 예시
```typescript
interface AgenticMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: ToolCall[];      // assistant가 요청한 도구 호출
  tool_call_id?: string;        // tool 응답 시 필수
  name?: string;                // tool 응답 시 도구 이름
}

// 예시: 3번째 iteration의 messages 배열
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userInput },

  // Iteration 1
  { role: 'assistant', tool_calls: [{ id: 'call_1', function: { name: 'read_file', arguments: '{"path":"/notes/meeting.md"}' } }] },
  { role: 'tool', tool_call_id: 'call_1', name: 'read_file', content: '파일 내용...' },

  // Iteration 2
  { role: 'assistant', tool_calls: [{ id: 'call_2', function: { name: 'edit_file', arguments: '...' } }] },
  { role: 'tool', tool_call_id: 'call_2', name: 'edit_file', content: '성공' },

  // 현재 iteration에서 LLM이 응답...
];
```

#### 7.5.3 Max Token 80% 임계치 관리
```
┌─────────────────────────────────────────────────────────────────┐
│  토큰 사용량 관리 (뭐든지 입력 / 뭐든지 검색 공통)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  매 iteration 시작 시 토큰 계산:                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  현재 사용 토큰 = system_prompt + user_input + history   │    │
│  │  남은 토큰 = max_tokens - 현재 사용 토큰                  │    │
│  │  사용률 = 현재 사용 토큰 / max_tokens * 100              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  토큰 사용률에 따른 동작:                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  0% ~ 79%: 정상 동작                                      │  │
│  │                                                           │  │
│  │  80% ~ 99%: ⚠️ 마무리 모드                                │  │
│  │    - System prompt에 아래 내용 추가:                      │  │
│  │    "⚠️ 토큰 사용량 경고: 현재 {사용률}% 사용 중.          │  │
│  │     남은 토큰: {남은 토큰}개.                             │  │
│  │     반드시 다음 1-2 iteration 내에 complete()를 호출하여  │  │
│  │     작업을 마무리하세요. 추가 작업이 필요하면 요약하여     │  │
│  │     사용자에게 재요청을 안내하세요."                      │  │
│  │                                                           │  │
│  │  100%: 강제 종료                                          │  │
│  │    - 현재까지 작업 저장                                   │  │
│  │    - 미완료 상태로 사용자에게 알림                        │  │
│  │    - Knox Mail로 상세 내용 발송                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.5.4 토큰 경고 System Prompt 템플릿
```typescript
// 80% 이상일 때 system prompt에 추가되는 경고문
const tokenWarning = `
⚠️ TOKEN LIMIT WARNING ⚠️
- 현재 토큰 사용률: ${usagePercent}%
- 남은 토큰: ${remainingTokens}개 (예상 ${Math.floor(remainingTokens / 100)}문장)
- 상태: 마무리 필요

지침:
1. 현재 진행 중인 작업을 즉시 완료하세요.
2. 추가 파일 읽기나 복잡한 수정은 피하세요.
3. 다음 1-2 iteration 내에 반드시 complete()를 호출하세요.
4. 미완료 작업이 있다면 summary에 "추가 작업 필요: ..."로 명시하세요.
`;
```

#### 7.5.5 토큰 계산 구현 (OpenAI API 응답 활용)
```typescript
/**
 * OpenAI Compatible API는 모든 응답에 usage 정보를 포함
 * 이를 누적하여 토큰 사용량 추적
 */

interface LLMResponse {
  // ... 기타 필드
  usage: {
    prompt_tokens: number;      // 입력 토큰 (messages 전체)
    completion_tokens: number;  // 출력 토큰 (assistant 응답)
    total_tokens: number;       // prompt + completion
  };
}

// Agentic 세션 상태 관리
interface AgenticSession {
  maxTokens: number;              // 모델의 최대 컨텍스트 (예: 128000)
  accumulatedPromptTokens: number;  // 누적 입력 토큰
  lastPromptTokens: number;       // 마지막 요청의 prompt_tokens
  iterationCount: number;
}

// 매 LLM 응답 후 호출
function updateTokenUsage(
  session: AgenticSession,
  response: LLMResponse
): TokenUsageStatus {
  // OpenAI API 응답의 usage 정보 활용
  const { prompt_tokens, completion_tokens } = response.usage;

  // 현재 iteration의 전체 컨텍스트 = prompt_tokens (이전 history 포함)
  session.lastPromptTokens = prompt_tokens;
  session.iterationCount++;

  // 다음 iteration에서의 예상 사용량
  // = 현재 prompt_tokens + 이번 completion + 다음 tool 응답 예상
  const estimatedNextPrompt = prompt_tokens + completion_tokens + 500; // 500 = tool 응답 여유분

  const usagePercent = Math.round((estimatedNextPrompt / session.maxTokens) * 100);
  const remainingTokens = session.maxTokens - estimatedNextPrompt;

  return {
    currentPromptTokens: prompt_tokens,
    completionTokens: completion_tokens,
    estimatedNextPrompt,
    remainingTokens,
    usagePercent,
    needsFinish: usagePercent >= 80,
    isExceeded: usagePercent >= 100,
  };
}

// 사용 예시
async function runAgenticLoop(session: AgenticSession, messages: Message[]) {
  while (session.iterationCount < 100) {
    const response = await callLLM(messages);

    // OpenAI 응답의 usage 정보로 토큰 계산
    const tokenStatus = updateTokenUsage(session, response);

    console.log(`[Token] Iteration ${session.iterationCount}: ` +
      `prompt=${tokenStatus.currentPromptTokens}, ` +
      `completion=${tokenStatus.completionTokens}, ` +
      `usage=${tokenStatus.usagePercent}%`);

    // 80% 도달 시 마무리 모드
    if (tokenStatus.needsFinish) {
      // System prompt에 경고 추가 (7.5.4 참조)
      messages[0].content += getTokenWarning(tokenStatus);
    }

    // 100% 도달 시 강제 종료
    if (tokenStatus.isExceeded) {
      await forceComplete(session, messages, 'token_limit_exceeded');
      break;
    }

    // tool_calls 처리 및 history에 추가
    // ...
  }
}
```

#### 7.5.6 모델별 Max Tokens 설정
```typescript
// 모델별 컨텍스트 크기 (Dashboard에서 조회하거나 환경변수로 설정)
const MODEL_MAX_TOKENS: Record<string, number> = {
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16385,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  // 기본값 (알 수 없는 모델)
  'default': 32000,
};

function getMaxTokens(modelName: string): number {
  return MODEL_MAX_TOKENS[modelName] || MODEL_MAX_TOKENS['default'];
}
```

### 7.6 노트 입력 플로우
```
┌─────────────────────────────────────────────────────────────────┐
│                    노트 입력 Agentic 플로우                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 사용자가 "뭐든지 입력" 모달에 아무 내용 입력                     │
│                          ↓                                      │
│  2. Rate Limit 체크 (분당 5회)                                   │
│                          ↓                                      │
│  3. 요청이 큐에 등록 (팀별/개인별 별도 큐)                          │
│     - WebSocket으로 큐 상태 실시간 전송                           │
│                          ↓                                      │
│  4. 큐에서 순차 처리 시작                                         │
│                          ↓                                      │
│  5. 중복 체크 (LLM 판단)                                         │
│     - 중복 발견 시: 입력한 사용자들에게 Knox Mail 알림              │
│     - LLM이 기존 노트에 추가 or 새로 생성 판단                     │
│                          ↓                                      │
│  6. LLM Agent에게 전달:                                          │
│     - 사용자 입력 내용                                            │
│     - 현재 폴더/파일 트리 구조 (요약본)                            │
│     - 도구 목록                                                  │
│                          ↓                                      │
│  7. LLM Agent가 recursive하게 도구 실행:                          │
│     ┌─────────────────────────────────────────┐                 │
│     │  Loop until complete() or 100회 초과:    │                 │
│     │   - read_file로 기존 내용 확인           │                 │
│     │   - 새 폴더 필요시 add_folder            │                 │
│     │   - 새 파일 필요시 add_file              │                 │
│     │   - 기존 파일 수정시 edit_file           │                 │
│     │   - 파일 이동시 move_file                │                 │
│     │   - 실수시 undo_* 도구로 롤백            │                 │
│     └─────────────────────────────────────────┘                 │
│                          ↓                                      │
│  8. 100회 초과 시:                                               │
│     - 강제 종료                                                  │
│     - Knox Mail로 실패 알림 (HTML 형식)                          │
│     - UI에 재시도 버튼 표시                                       │
│                          ↓                                      │
│  9. complete() 호출 시 작업 종료                                  │
│                          ↓                                      │
│ 10. 3개 언어 버전 생성 (한국어 필수, 영어/중국어 선택적)             │
│     - 한국어 실패 시: 전체 실패                                   │
│     - 영어/중국어 실패 시: 해당 언어 재시도 버튼 노트에 표시         │
│                          ↓                                      │
│ 11. WebSocket으로 완료 알림                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.7 LLM 모델
- Dashboard 기본 모델 사용
- Dashboard LLM Proxy를 통해 호출
- serviceId: `once-notes`

### 7.8 Fallback 정책
```
LLM API 호출 실패 시:
1. 3회 재시도 (1초, 2초, 4초 간격)
2. 실패 시 5분 대기
3. 3회 추가 재시도
4. 최종 실패 시:
   - Knox Mail로 실패 알림
   - UI에 토스트 메시지
   - 재시도 버튼 표시
```

---

## 8. 큐 시스템

### 8.1 큐 구조
```
┌─────────────────────────────────────────────────────────────────┐
│                         큐 시스템 구조                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  개인 노트 큐 (사용자별):                                         │
│  ┌─────────────────────────────────────┐                        │
│  │ User A 개인 큐 → [요청1] [요청2] ... │  ← 순차 처리            │
│  │ User B 개인 큐 → [요청1] ...         │  ← 순차 처리            │
│  └─────────────────────────────────────┘                        │
│                                                                 │
│  팀 노트 큐 (팀별):                                               │
│  ┌─────────────────────────────────────┐                        │
│  │ 팀 A 큐 → [요청1] [요청2] ...        │  ← 순차 처리            │
│  │ 팀 B 큐 → [요청1] ...                │  ← 순차 처리            │
│  └─────────────────────────────────────┘                        │
│                                                                 │
│  ※ 서로 다른 공간의 큐는 동시 처리 가능 (최대 20개)               │
│  ※ 같은 공간의 큐는 순차 처리 (동시성 충돌 방지)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 큐 설정
| 항목 | 설정 |
|------|------|
| 동시 처리 큐 수 | **최대 20개** |
| 같은 공간 처리 | 순차 처리 |
| 타임아웃 | 무제한 (100회 반복 제한으로 대체) |
| 요청 취소 | **대기 중인 요청만 취소 가능** |
| 영속성 | Redis 재시작 시에도 유지 (Bull 기본 설정) |

### 8.3 큐 상태 실시간 업데이트 (WebSocket)
```typescript
// 서버 → 클라이언트 이벤트
interface QueueStatusEvent {
  type: 'QUEUE_UPDATE';
  data: {
    requestId: string;
    position: number;      // 내 순서 (1부터 시작)
    totalInQueue: number;  // 전체 대기 중인 요청 수
    status: 'waiting' | 'processing' | 'completed' | 'failed';
    progress?: number;     // 처리 중일 때 진행률 (0-100)
    message?: string;      // 상태 메시지
  };
}

// 완료 이벤트
interface RequestCompleteEvent {
  type: 'REQUEST_COMPLETE';
  data: {
    requestId: string;
    success: boolean;
    result?: {
      filesCreated: string[];
      filesModified: string[];
      foldersCreated: string[];
    };
    error?: string;
  };
}
```

---

## 9. 검색 시스템

> **⚠️ Agentic 동작 주의사항**: 검색도 LLM Agent가 recursive하게 동작합니다.
> 섹션 7.5의 **토큰 관리 및 History 유지** 규칙이 동일하게 적용됩니다.

### 9.1 LLM Agent 기반 검색
```
┌─────────────────────────────────────────────────────────────────┐
│                    검색 Agentic 플로우                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 사용자가 자연어로 검색                                        │
│     예: "지난주에 썼던 회의록", "한수석님이 올린 내용 정리해줘"     │
│                          ↓                                      │
│  2. Rate Limit 체크 (분당 10회)                                  │
│                          ↓                                      │
│  3. 검색 범위 결정                                               │
│     - 현재 탭 기준: 개인 탭 → 개인 노트, 팀 탭 → 팀 노트          │
│     - 현재 선택된 언어 버전에서 검색                              │
│                          ↓                                      │
│  4. LLM Agent에게 전달:                                          │
│     - 검색 쿼리                                                  │
│     - 전체 폴더/파일 트리 구조 (요약)                             │
│     - read_file 도구                                            │
│     - ⚠️ 토큰 사용률 정보 (80% 이상 시 경고)                     │
│                          ↓                                      │
│  5. LLM Agent가 recursive하게 탐색:                              │
│     ┌─────────────────────────────────────────┐                 │
│     │  - 트리 구조 분석                        │                 │
│     │  - 관련 있어 보이는 파일 read_file       │                 │
│     │  - 내용 확인 후 관련성 판단              │                 │
│     │  - 필요시 더 많은 파일 탐색              │                 │
│     │  ⚠️ 매 iteration: History 유지 필수     │                 │
│     │  ⚠️ 80% 토큰 도달 시 마무리 모드         │                 │
│     └─────────────────────────────────────────┘                 │
│                          ↓                                      │
│  6. 관련성 높은 순서대로 ranking하여 반환                          │
│                          ↓                                      │
│  7. 검색 결과 리스트 표시                                         │
│     - 클릭 시 노트 미리보기 팝업                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 검색 결과 UI
```typescript
interface SearchResult {
  noteId: string;
  path: string;           // 파일 경로
  title: string;          // 노트 제목
  snippet: string;        // 관련 내용 미리보기 (검색어 하이라이트)
  relevanceScore: number; // 관련성 점수 (0-100)
  lastModified: Date;
  language: 'KO' | 'EN' | 'CN';
  createdBy: string;      // 작성자 loginid
}
```

---

## 10. 폴더 구조 Refactoring (관리자 전용)

### 10.1 접근 권한
- **Super Admin**: 모든 팀 + 개인 공간
- **Team Admin**: 해당 팀 공간만
- 별도 관리자 전용 탭/페이지에서 실행

### 10.2 3단계 프로세스

#### Step 1: LLM Agentic 구조 변경
```
┌─────────────────────────────────────────────────────────────────┐
│  LLM Agent가 기존 구조를 분석하고 새로운 최적 구조 생성            │
│                                                                 │
│  사용 도구 (기존 공간은 유지, 새 공간에서 작업):                   │
│  - create_folder: 새 폴더 생성                                   │
│  - delete_folder: 폴더 삭제                                      │
│  - add_page: 새 페이지 생성                                      │
│  - delete_page: 페이지 삭제                                      │
│  - edit_page: 페이지 수정                                        │
│  - read_page: 페이지 읽기                                        │
│                                                                 │
│  ※ 기존 내용 유실 없이 최적의 구조로 변경                          │
│  ※ LLM이 complete 결정 내릴 때까지 recursive 실행                 │
│  ※ 새로운 임시 공간에서만 작업 (기존 공간 보존)                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2: 검증 루프 (3회 반복)
```
┌─────────────────────────────────────────────────────────────────┐
│  동일한 도구로 기존 vs 신규 비교 검증                              │
│                                                                 │
│  Loop 3회:                                                       │
│    1. LLM에게 기존 구조 트리 + 신규 구조 트리 제공                 │
│    2. 유실된 내용이 있는지 확인 요청                              │
│    3. 유실된 내용 발견 시 → 신규 구조에 추가                       │
│    4. 없으면 다음 루프 또는 완료                                  │
│                                                                 │
│  ※ 3회 검증 후에도 유실 가능성 있으면 관리자에게 경고 표시          │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3: 관리자 승인
```
┌─────────────────────────────────────────────────────────────────┐
│  관리자에게 비교 UI 제공                                          │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   기존 구조       │    │   신규 구조       │                   │
│  │   (Tree View)    │ vs │   (Tree View)    │                   │
│  │   - 폴더 수: 10  │    │   - 폴더 수: 8   │                   │
│  │   - 파일 수: 50  │    │   - 파일 수: 50  │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                 │
│  ⚠️ 검증 완료: 유실된 내용 없음                                   │
│                                                                 │
│  [취소] [승인]                                                    │
│                                                                 │
│  승인 시: 기존 구조 → 백업 → 신규 구조로 교체                      │
│  취소 시: 신규 구조 폐기, 기존 유지                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. 다국어 시스템

### 11.1 자동 3개 언어 생성
| 언어 | 필수 여부 | 실패 시 처리 |
|------|----------|-------------|
| 한국어 (KO) | **필수** | 전체 요청 실패 |
| 영어 (EN) | 선택 | 노트에 재시도 버튼 표시 |
| 중국어 (CN) | 선택 | 노트에 재시도 버튼 표시 |

### 11.2 언어 전환 UI
```
┌─────────────────────────────────────────────┐
│  노트 상단                                   │
│  ┌─────┬─────┬─────┐                        │
│  │ KR  │ EN  │ CN  │  ← 언어 탭              │
│  │ ✓   │ ✓   │ ⟳   │  ← 상태 (⟳ = 재시도)    │
│  └─────┴─────┴─────┘                        │
│                                             │
│  (선택된 언어의 노트 내용 표시)               │
└─────────────────────────────────────────────┘
```

### 11.3 검색 언어
- **현재 선택된 언어** 버전에서만 검색

### 11.4 내보내기 언어
- **현재 선택된 언어** 버전으로 마크다운 내보내기

### 11.5 UI 언어
- 한국어/영어/중국어 지원
- 설정에서 수동 전환

---

## 12. 블록 에디터

### 12.1 지원 블록 타입
| 카테고리 | 블록 타입 |
|---------|----------|
| 기본 | 텍스트(Paragraph), 제목(H1, H2, H3) |
| 리스트 | 글머리 기호, 번호 매기기, 체크박스 |
| 코드 | 코드 블록 (syntax highlighting) |
| 인용 | 인용문(Blockquote), 콜아웃 |
| 구조 | 테이블, 구분선, 토글(접기/펼치기) |
| 고급 | 수식(LaTeX), 다이어그램(Mermaid) |
| 미디어 | 임베드(YouTube, 링크 미리보기) |

### 12.2 블록 단위 댓글 (쓰레드 토론)
```
┌─────────────────────────────────────────────┐
│  블록 내용                          💬 3    │ ← 댓글 아이콘
├─────────────────────────────────────────────┤
│  │ 댓글 1 (홍길동, 2024-01-28 14:30)       │
│  │  └ 답글 1-1 (김철수)                    │
│  │  └ 답글 1-2 (홍길동)                    │
│  │ 댓글 2 (박영희, 2024-01-28 15:00)       │
│  │   [수정] [삭제]  ← 본인 또는 관리자만    │
└─────────────────────────────────────────────┘
```

### 12.3 댓글 권한
| 작업 | 권한 |
|------|------|
| 댓글 작성 | 모든 팀원 |
| 댓글 수정 | 본인 + 팀 관리자 |
| 댓글 삭제 | 본인 + 팀 관리자 |

### 12.4 사용자 입력 제한 (⚠️ 핵심 제약사항)
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ 사용자 수동 편집 불가                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ 불가능한 것:                                                │
│     - 노트 내용 직접 수정                                       │
│     - 노트 제목/위치 직접 변경                                  │
│     - 폴더 구조 직접 변경 (관리자 Refactoring 제외)              │
│                                                                 │
│  ✅ 가능한 것:                                                  │
│     - 블록 단위 댓글 작성/수정/삭제                             │
│     - "뭐든지 입력"을 통한 수정 요청                            │
│     - 노트 조회, 검색, 내보내기                                 │
│                                                                 │
│  📝 수정 요청 예시:                                             │
│     - "방금 저장한 회의록에 결론 추가해줘: ..."                  │
│     - "프로젝트 A 노트 제목을 'Q1 계획'으로 바꿔줘"              │
│     - "어제 쓴 아이디어 노트 삭제해줘"                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**블록 에디터 동작**:
- 노트 뷰어에서 블록 내용은 **읽기 전용**으로 표시
- 커서 위치/텍스트 선택은 가능 (복사용)
- 수정 시도 시 "뭐든지 입력" 모달 안내 토스트 표시

---

## 13. History 시스템

### 13.1 History 저장 규칙
- 노트 내용이 수정될 때마다 기존 내용이 history로 기록
- 폴더 구조 변경 시 history도 함께 이동
- 언어별로 별도 history 관리

### 13.2 History 보관 정책
| 항목 | 설정 |
|------|------|
| 보관 기간 | **1달 (30일)** |
| 삭제 알림 | 삭제 **1주/2일/1일 전** Knox Mail 알림 |
| 알림 대상 | 해당 노트를 수정했던 **모든 사용자** |

### 13.3 History UI
```
┌─────────────────────────────────────────────┐
│  노트 내용                                   │
│  ...                                        │
├─────────────────────────────────────────────┤
│  ▼ History (3개)                    [접기]  │
├─────────────────────────────────────────────┤
│  │ 2024-01-28 14:30 - 홍길동               │
│  │   (이전 내용 미리보기...)                │
│  │   [삭제 예정: 7일 후]                    │
│  │ 2024-01-27 10:00 - 김철수               │
│  │   (이전 내용 미리보기...)                │
│  │ 2024-01-26 09:00 - 홍길동 (최초 생성)   │
│  │   (이전 내용 미리보기...)                │
└─────────────────────────────────────────────┘
```

---

## 14. UI/UX 설계

### 14.1 전체 레이아웃
```
┌─────────────────────────────────────────────────────────────────┐
│  Header: ONCE 로고 | 검색바 | [KR▼] | 🌙 | 👤 프로필      │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│  Sidebar   │                    Main Content                   │
│  (280px)   │                                                    │
│            │                                                    │
│ ┌────────┐ │  ┌──────────────────────────────────────────────┐ │
│ │개인│팀 │ │  │                                              │ │
│ └────────┘ │  │     (홈: 검색 중심)                           │ │
│            │  │     (노트: 블록 에디터)                        │ │
│ 노트 트리   │  │     (검색 결과: 리스트 + 미리보기)             │ │
│ ├─ 📁 폴더 │  │                                              │ │
│ │  ├─ 📄   │  │                                              │ │
│ │  └─ 📄   │  │                                              │ │
│ └─ 📁 폴더 │  └──────────────────────────────────────────────┘ │
│            │                                                    │
│ [휴지통]   │  ┌──────────────────────────────────────────────┐ │
│            │  │ [+ 뭐든지 입력] FAB 버튼                      │ │
│            │  └──────────────────────────────────────────────┘ │
└────────────┴────────────────────────────────────────────────────┘
```

### 14.2 홈 화면 (검색 중심)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        🗒️ ONCE                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 무엇이든 검색하세요...                                   │  │
│  │    "지난주 회의록", "한수석님이 작성한 내용" 등              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  최근 노트                                            [더보기]  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ 📄 노트1    │ │ 📄 노트2    │ │ 📄 노트3    │               │
│  │ 1시간 전    │ │ 3시간 전    │ │ 어제        │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 14.3 빈 상태 (온보딩 가이드)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     🎉 ONCE에 오신 것을 환영합니다!         │
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  💡 첫 노트를 만들어보세요                            │      │
│    │                                                     │      │
│    │  1. 오른쪽 하단의 [+ 뭐든지 입력] 버튼을 클릭하세요    │      │
│    │  2. 회의록, 아이디어, 메모 등 아무 내용이나 입력하세요  │      │
│    │  3. AI가 자동으로 정리해서 저장해드립니다             │      │
│    │                                                     │      │
│    │                    [시작하기]                        │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                 │
│    📖 도움말 보기  |  📬 문의하기                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 14.4 "뭐든지 입력" 모달

> **⚠️ 중요: 사용자 수동 편집 불가**
> 이 모달에서 입력한 내용은 AI가 처리하여 노트로 저장합니다.
> **저장된 노트를 직접 수정할 수 없습니다.**
> 수정이 필요한 경우 이 모달을 통해 "~~를 수정해줘" 형태로 요청해야 합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  뭐든지 입력                                              [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "텍스트든, 붙여넣기든 뭐든 입력하세요.                           │
│   제가 알아서 정리해드릴게요." 🤖                                │
│                                                                 │
│  ⚠️ 저장된 노트는 직접 수정할 수 없습니다.                        │
│     수정이 필요하면 여기서 "~~를 수정해줘"라고 입력하세요.         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              (큰 텍스트 입력 영역)                         │  │
│  │              모든 포맷 지원: 텍스트, 마크다운, HTML        │  │
│  │                                                           │  │
│  │  예시:                                                    │  │
│  │  - "오늘 회의에서 논의한 내용..."  (새 노트 생성)          │  │
│  │  - "아까 입력한 회의록에 결론 추가해줘: ..."  (기존 수정)  │  │
│  │  - "프로젝트 A 관련 노트 제목 바꿔줘" (이름 변경)          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📎 모달 크기 조절 가능 (드래그)                                 │
│                                                                 │
│  [개인 노트 ▼]                               [취소] [저장하기]   │
└─────────────────────────────────────────────────────────────────┘
```

**UI 구현 시 주의사항**:
- 모달 상단에 "직접 수정 불가" 경고 문구 상시 표시
- 온보딩 시 이 제약사항을 명확히 안내
- 도움말에서 수정 요청 방법 예시 제공

### 14.5 큐 상태 UI
```
┌─────────────────────────────────────────────┐
│  🔄 처리 중...                               │
│  ┌─────────────────────────────────────┐    │
│  │ ████████████░░░░░░░░ 60%            │    │
│  └─────────────────────────────────────┘    │
│  현재 순서: 2번째 / 전체 5개 대기 중          │
│                                             │
│  💡 다른 작업을 하셔도 됩니다.               │
│     완료되면 알려드릴게요.                   │
│                                             │
│  [요청 취소]  ← 대기 중일 때만 표시          │
└─────────────────────────────────────────────┘
```

### 14.6 로딩 UI
- **스켈레톤 로딩**: 콘텐츠 영역에 스켈레톤 표시
- 노트 목록, 트리 구조, 노트 내용 모두 스켈레톤 적용

### 14.7 에러 UI
```
┌─────────────────────────────────────────────┐
│  ❌ 오류가 발생했습니다                       │  ← 토스트 (5초 후 자동 닫힘)
│  요청 처리에 실패했습니다.                    │
│  이메일로 상세 내용을 보내드렸습니다.         │
│                                             │
│  [재시도] [닫기]                             │
└─────────────────────────────────────────────┘

+ Knox Mail로 상세 에러 내용 발송
```

### 14.8 다크모드
- 수동 전환 (헤더의 🌙/☀️ 토글)
- 라이트/다크 2가지 테마
- localStorage에 설정 저장

### 14.9 반응형
| 화면 크기 | 레이아웃 |
|----------|---------|
| Desktop (1024px+) | 사이드바 고정 + 메인 콘텐츠 |
| Tablet (768-1023px) | 사이드바 접기 가능 |
| Mobile (~767px) | 햄버거 메뉴 + 전체 화면 콘텐츠 |

### 14.10 브라우저 지원
- Chrome 최신 2버전
- Edge 최신 2버전
- Safari 최신 2버전
- ❌ IE 미지원

### 14.11 접근성 (A11y)
- 키보드 네비게이션 지원
- ARIA 라벨 적용
- 색상 대비 4.5:1 이상

---

## 15. 추가 기능

### 15.1 링크 공유
```typescript
interface ShareLink {
  noteId: string;
  url: string;        // https://a2g.samsungds.net/notes/{noteId}
  createdBy: string;
  createdAt: Date;
}

// 접근 조건:
// 1. SSO 로그인 필수
// 2. 해당 팀원만 접근 가능 (개인 노트는 본인만)
// 3. Super Admin은 모든 링크 접근 가능
```

### 15.2 마크다운 내보내기
| 항목 | 설정 |
|------|------|
| 범위 | 단일 노트만 |
| 언어 | 현재 선택된 언어 버전 |
| 댓글 포함 | **선택 가능** (체크박스) |
| 파일 형식 | `.md` |

### 15.3 휴지통
| 항목 | 설정 |
|------|------|
| 자동 삭제 | **30일 후** |
| 복원 | 팀원 누구나 가능 |
| 영구 삭제 | **관리자만** (30일 전에 삭제 가능) |
| 비우기 | **관리자만** |

### 15.4 도움말
- 서비스 내 도움말 페이지
- 온보딩 가이드 (첫 로그인 시 표시)
- Dashboard docs-site에 "ONCE" 가이드 추가
- 기존 AIPO 문서는 "AIPO for Desktop"으로 변경

### 15.5 문의 및 피드백
| 항목 | 내용 |
|------|------|
| 개발자 | `syngha.han` |
| 문의/피드백 | Dashboard Feedback 페이지로 연결 |
| 링크 | `https://a2g.samsungds.net/feedback` (Dashboard) |

**UI 구현**:
```
┌─────────────────────────────────────────────┐
│  헤더 또는 설정 페이지                        │
├─────────────────────────────────────────────┤
│                                             │
│  📬 문의/피드백                              │
│  버그 리포트, 기능 제안, 질문 등을 남겨주세요  │
│                                             │
│  [피드백 남기기]  → Dashboard /feedback 이동  │
│                                             │
│  개발: syngha.han                           │
│                                             │
└─────────────────────────────────────────────┘
```

**주의사항**:
- ONCE 자체 피드백 시스템 구축하지 않음
- Dashboard의 기존 Feedback 시스템 활용
- 피드백 작성 시 서비스 선택에서 "ONCE" 선택하도록 안내

---

## 16. 관리자 기능

### 16.1 Super Admin 전용 페이지
| 기능 | 설명 |
|------|------|
| 팀 관리자 지정 | 각 팀의 관리자 권한 부여/회수 |
| 전체 통계 | 서비스 전체 사용 통계 |
| 전체 감사 로그 | 모든 팀의 감사 로그 조회 |
| 시스템 설정 | 큐 설정, Rate Limit 등 |
| 모든 팀 접근 | 모든 팀 노트 조회/검색 |

### 16.2 Team Admin 전용 탭
| 기능 | 설명 |
|------|------|
| 폴더 구조 Refactoring | 팀 노트 구조 재구성 |
| 팀 통계 | 팀 내 사용 통계 |
| 팀 감사 로그 | 팀 내 활동 로그 조회 |
| 휴지통 관리 | 영구 삭제, 비우기 |

---

## 17. Knox Mail 연동

### 17.1 API 정보
```
URL: http://genai.samsungds.net:20080/knox/mail/send
Method: POST
Content-Type: application/json
```

### 17.2 메일 발송 케이스
| 케이스 | 수신자 | 내용 |
|--------|--------|------|
| LLM 100회 초과 강제 종료 | 요청한 사용자 | 실패 알림 + 재시도 방법 안내 |
| LLM API 최종 실패 | 요청한 사용자 | 실패 상세 내용 + 재시도 버튼 |
| History 삭제 예정 (1주 전) | 해당 노트 수정자 전원 | 삭제 예정 알림 |
| History 삭제 예정 (2일 전) | 해당 노트 수정자 전원 | 삭제 임박 알림 |
| History 삭제 예정 (1일 전) | 해당 노트 수정자 전원 | 최종 알림 |
| 중복 노트 감지 | 입력한 사용자들 | 중복 알림 |
| 에러 발생 | 요청한 사용자 | 에러 상세 내용 |

### 17.3 메일 템플릿 (HTML)
```html
<!-- 예시: LLM 실패 알림 -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a56db; color: white; padding: 20px; }
    .content { padding: 20px; background: #f9fafb; }
    .button { background: #1a56db; color: white; padding: 12px 24px;
              text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ONCE 알림</h1>
    </div>
    <div class="content">
      <h2>요청 처리 실패</h2>
      <p>요청하신 작업이 실패했습니다.</p>
      <p><strong>실패 사유:</strong> LLM 처리 횟수 초과 (100회)</p>
      <p><strong>요청 시간:</strong> 2024-01-28 14:30:00</p>
      <p><strong>요청 내용:</strong> (일부 발췌)</p>
      <blockquote>회의록 정리...</blockquote>
      <br>
      <a href="https://a2g.samsungds.net/notes/retry/xxx" class="button">
        재시도하기
      </a>
    </div>
  </div>
</body>
</html>
```

---

## 18. 모니터링 / 로깅

### 18.1 Dashboard 통합
- 기존 Dashboard에서 ONCE 사용량 통계 확인
- serviceId: `once-notes`
- Dashboard 사용량 수집 방식과 동일

### 18.2 수집 데이터
| 항목 | 설명 |
|------|------|
| 사용자별 요청 수 | 노트 입력/검색 요청 수 |
| LLM 토큰 사용량 | 입력/출력 토큰 |
| 응답 시간 | LLM 처리 시간, API 응답 시간 |
| 에러 로그 | 실패한 요청 상세 기록 |
| 큐 대기 시간 | 평균 큐 대기 시간 |

### 18.3 Health Check
```
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-28T14:30:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "llm_proxy": "ok"
  },
  "queue": {
    "pending": 5,
    "processing": 3
  }
}
```

---

## 19. 백업 전략

### 19.1 백업 구성
```
┌─────────────────────────────────────────────────────────────────┐
│                         백업 전략                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 일일 전체 백업 (Daily Full Backup)                           │
│     - 시간: 매일 새벽 3시 (KST)                                  │
│     - 방식: pg_dump --format=custom                             │
│     - 저장: /backups/daily/once_notes_YYYYMMDD.dump             │
│     - 보관: 30일                                                │
│                                                                 │
│  2. 주간 압축 백업 (Weekly Compressed)                           │
│     - 시간: 매주 일요일 새벽 4시                                  │
│     - 방식: 일일 백업 파일 압축 (gzip)                           │
│     - 저장: /backups/weekly/once_notes_YYYYWW.dump.gz           │
│     - 보관: 12주 (3개월)                                        │
│                                                                 │
│  3. Redis 백업                                                   │
│     - 방식: RDB 스냅샷 (BGSAVE)                                  │
│     - 주기: 1시간마다                                            │
│     - 저장: /backups/redis/                                     │
│                                                                 │
│  4. 복구 절차                                                    │
│     - pg_restore -d once_notes /backups/daily/xxx.dump          │
│     - 예상 RTO: 30분 이내                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 19.2 백업 스크립트
```bash
#!/bin/bash
# /scripts/backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR=/backups/daily

# PostgreSQL 백업
pg_dump -h localhost -p 16003 -U postgres -Fc once_notes \
  > $BACKUP_DIR/once_notes_$DATE.dump

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

# Redis 백업
redis-cli -p 16004 BGSAVE
cp /data/redis/dump.rdb /backups/redis/dump_$DATE.rdb
```

---

## 20. 데이터베이스 스키마

### 20.1 ER 다이어그램 (텍스트)
```
User ─────┬──── Space (PERSONAL)
          │
          ├──── TeamMember ──── Team ──── Space (TEAM)
          │                       │
          │                       └──── TeamAdmin
          │
          ├──── Comment
          │
          ├──── Request ──── RequestLog
          │
          └──── AuditLog

Space ──── Folder ──── File ──── FileVersion ──── History
                                     │
                                     └──── Comment
```

### 20.2 Prisma 스키마
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 사용자 관련 ====================

model User {
  id           String   @id @default(cuid())
  loginid      String   @unique
  username     String
  deptname     String
  businessUnit String
  createdAt    DateTime @default(now())
  lastActive   DateTime @default(now())

  personalSpace   Space?       @relation("PersonalSpace")
  teamMemberships TeamMember[]
  teamAdmins      TeamAdmin[]
  comments        Comment[]
  requests        Request[]
  auditLogs       AuditLog[]

  @@index([loginid])
  @@index([deptname])
}

model Team {
  id          String   @id @default(cuid())
  name        String   @unique  // deptname에서 추출
  displayName String
  createdAt   DateTime @default(now())

  space   Space?       @relation("TeamSpace")
  members TeamMember[]
  admins  TeamAdmin[]

  @@index([name])
}

model TeamMember {
  id       String   @id @default(cuid())
  userId   String
  teamId   String
  joinedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([userId, teamId])
  @@index([teamId])
}

model TeamAdmin {
  id        String   @id @default(cuid())
  userId    String
  teamId    String
  grantedAt DateTime @default(now())
  grantedBy String   // Super Admin loginid

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([userId, teamId])
  @@index([teamId])
}

// ==================== 공간/폴더/파일 ====================

model Space {
  id        String    @id @default(cuid())
  type      SpaceType
  userId    String?   @unique  // PERSONAL인 경우
  teamId    String?   @unique  // TEAM인 경우
  createdAt DateTime  @default(now())

  user      User?      @relation("PersonalSpace", fields: [userId], references: [id])
  team      Team?      @relation("TeamSpace", fields: [teamId], references: [id])
  folders   Folder[]
  files     File[]
  requests  Request[]
  auditLogs AuditLog[]

  @@index([type])
}

enum SpaceType {
  PERSONAL
  TEAM
}

model Folder {
  id        String   @id @default(cuid())
  name      String
  path      String   // 전체 경로 (예: /project/aipo)
  spaceId   String
  parentId  String?  // 상위 폴더 (null이면 루트)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  space    Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  parent   Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children Folder[] @relation("FolderHierarchy")
  files    File[]

  @@unique([spaceId, path])
  @@index([spaceId])
  @@index([parentId])
}

model File {
  id        String    @id @default(cuid())
  name      String
  path      String
  spaceId   String
  folderId  String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime? // 휴지통 이동 시간

  space    Space         @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  folder   Folder?       @relation(fields: [folderId], references: [id])
  versions FileVersion[]
  comments Comment[]

  @@unique([spaceId, path])
  @@index([spaceId])
  @@index([folderId])
  @@index([deletedAt])
}

model FileVersion {
  id        String   @id @default(cuid())
  fileId    String
  language  Language
  content   String   @db.Text  // 블록 JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  file      File      @relation(fields: [fileId], references: [id], onDelete: Cascade)
  histories History[]

  @@unique([fileId, language])
  @@index([fileId])
}

enum Language {
  KO
  EN
  CN
}

model History {
  id            String   @id @default(cuid())
  fileVersionId String
  content       String   @db.Text
  changedAt     DateTime @default(now())
  changedBy     String   // loginid
  expiresAt     DateTime // 30일 후 자동 삭제

  fileVersion FileVersion @relation(fields: [fileVersionId], references: [id], onDelete: Cascade)

  @@index([fileVersionId])
  @@index([expiresAt])
  @@index([changedBy])
}

// ==================== 댓글 ====================

model Comment {
  id        String   @id @default(cuid())
  fileId    String
  blockId   String   // 블록 ID
  userId    String
  content   String   @db.Text
  parentId  String?  // 답글인 경우
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  file    File      @relation(fields: [fileId], references: [id], onDelete: Cascade)
  user    User      @relation(fields: [userId], references: [id])
  parent  Comment?  @relation("CommentThread", fields: [parentId], references: [id])
  replies Comment[] @relation("CommentThread")

  @@index([fileId])
  @@index([blockId])
  @@index([userId])
}

// ==================== 요청/큐 ====================

model Request {
  id          String        @id @default(cuid())
  userId      String
  spaceId     String
  type        RequestType
  input       String        @db.Text
  status      RequestStatus @default(PENDING)
  position    Int?          // 큐에서의 순서
  result      String?       @db.Text
  error       String?
  retryCount  Int           @default(0)
  createdAt   DateTime      @default(now())
  startedAt   DateTime?
  completedAt DateTime?

  user User         @relation(fields: [userId], references: [id])
  space Space       @relation(fields: [spaceId], references: [id])
  logs RequestLog[]

  @@index([userId])
  @@index([spaceId])
  @@index([status])
  @@index([createdAt])
}

enum RequestType {
  INPUT
  SEARCH
  REFACTOR
}

enum RequestStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

model RequestLog {
  id        String   @id @default(cuid())
  requestId String
  tool      String
  params    String   @db.Text
  result    String?  @db.Text
  duration  Int?     // 밀리초
  createdAt DateTime @default(now())

  request Request @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@index([requestId])
}

// ==================== 감사 로그 ====================

model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  spaceId    String?
  action     AuditAction
  targetType String      // FILE, FOLDER, COMMENT, etc.
  targetId   String?
  details    Json?
  ipAddress  String?
  userAgent  String?
  timestamp  DateTime    @default(now())

  user  User   @relation(fields: [userId], references: [id])
  space Space? @relation(fields: [spaceId], references: [id])

  @@index([userId])
  @@index([spaceId])
  @@index([action])
  @@index([timestamp])
}

enum AuditAction {
  LOGIN
  LOGOUT
  CREATE_NOTE
  UPDATE_NOTE
  DELETE_NOTE
  MOVE_NOTE
  RENAME_NOTE
  CREATE_FOLDER
  DELETE_FOLDER
  RENAME_FOLDER
  CREATE_COMMENT
  UPDATE_COMMENT
  DELETE_COMMENT
  RESTORE_FROM_TRASH
  PERMANENT_DELETE
  REFACTOR_STRUCTURE
  EXPORT_NOTE
  SHARE_LINK
}
```

---

## 21. API 엔드포인트

### 21.1 인증
| Method | Endpoint | 설명 | Rate Limit |
|--------|----------|------|------------|
| POST | /auth/login | SSO 로그인 | - |
| GET | /auth/me | 현재 사용자 정보 | - |
| GET | /auth/check | 세션 체크 | - |
| POST | /auth/refresh | 토큰 갱신 | - |

### 21.2 공간
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /spaces/personal | 개인 공간 정보 |
| GET | /spaces/team | 팀 공간 정보 |
| GET | /spaces/:id/tree | 폴더/파일 트리 |

### 21.3 노트
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /files/:id | 노트 조회 |
| GET | /files/:id/history | 노트 히스토리 |
| POST | /files/:id/export | 마크다운 내보내기 |
| POST | /files/:id/share | 공유 링크 생성 |
| GET | /files/:id/retry-translation/:lang | 번역 재시도 |

### 21.4 요청 (큐)
| Method | Endpoint | 설명 | Rate Limit |
|--------|----------|------|------------|
| POST | /requests/input | 노트 입력 요청 | **분당 5회** |
| POST | /requests/search | 검색 요청 | **분당 10회** |
| POST | /requests/refactor | 구조 변경 요청 (관리자) | - |
| GET | /requests/:id | 요청 상태 조회 | - |
| DELETE | /requests/:id | 요청 취소 (대기 중만) | - |
| GET | /requests/queue-status | 큐 상태 조회 | - |

### 21.5 댓글
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /files/:id/comments | 댓글 목록 |
| POST | /files/:id/comments | 댓글 작성 |
| PUT | /comments/:id | 댓글 수정 |
| DELETE | /comments/:id | 댓글 삭제 |

### 21.6 휴지통
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /trash | 휴지통 목록 |
| POST | /trash/:id/restore | 복원 |
| DELETE | /trash/:id | 영구 삭제 (관리자) |
| DELETE | /trash | 휴지통 비우기 (관리자) |

### 21.7 관리자
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /admin/teams | 팀 목록 |
| POST | /admin/teams/:id/admins | 팀 관리자 지정 |
| DELETE | /admin/teams/:id/admins/:userId | 팀 관리자 해제 |
| GET | /admin/stats | 전체 통계 |
| GET | /admin/audit-logs | 감사 로그 조회 |

### 21.8 설정
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /settings | 사용자 설정 조회 |
| PUT | /settings | 사용자 설정 변경 |

### 21.9 헬스체크
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /health | 서비스 상태 확인 |

---

## 22. WebSocket 이벤트

### 22.1 클라이언트 → 서버
| 이벤트 | 설명 |
|--------|------|
| `subscribe:queue` | 큐 상태 구독 |
| `unsubscribe:queue` | 큐 상태 구독 해제 |

### 22.2 서버 → 클라이언트
| 이벤트 | 설명 |
|--------|------|
| `queue:update` | 큐 상태 업데이트 |
| `request:progress` | 요청 진행률 업데이트 |
| `request:complete` | 요청 완료 |
| `request:failed` | 요청 실패 |

---

## 23. 제외된 기능

다음 기능은 v1.0에서 제외됨:
- ❌ 파일 첨부 (이미지 등)
- ❌ 알림 기능 (Knox Mail로 대체)
- ❌ 핀/즐겨찾기
- ❌ 키보드 단축키
- ❌ 외부 공유 (공개 링크)
- ❌ 실시간 협업 (CRDT) - 큐 시스템으로 대체
- ❌ 입력 중 임시 저장
- ❌ 다중 환경 (dev/staging)

---

## 24. 향후 고려사항 (Phase 2)

### 후보 기능
- 이미지 첨부
- 인앱 알림 시스템
- 핀/즐겨찾기
- 키보드 단축키
- 벡터 DB 기반 검색 개선
- 노트 템플릿
- 노트 공유 (조직 전체)
- API 사용 개선 (GraphQL?)

---

## 부록 A: Dashboard 연동 정보

> **Dashboard 위치**: `~/Dashboard` (본 monorepo의 루트)
> **참조 파일**: `~/Dashboard/packages/api/src/routes/proxy.routes.ts`

### A.1 인증 플로우 (auth.routes.ts 참조)
```typescript
// JWT Payload 구조 (Dashboard와 동일)
interface JWTPayload {
  loginid: string;
  deptname: string;
  username: string;
  iat?: number;
  exp?: number;
}

// SSO 토큰 디코딩 방식
// Frontend: btoa(unescape(encodeURIComponent(json)))
// Backend: decodeSSOToken() 함수 사용
```

### A.2 LLM Proxy 호출 시 필수 헤더 (사용량 추적용)
```typescript
/**
 * Dashboard LLM Proxy 호출 시 반드시 전송해야 하는 헤더
 * 참조: ~/Dashboard/packages/api/src/routes/proxy.routes.ts
 */

// LLM Proxy 요청 헤더
const headers = {
  'Content-Type': 'application/json',

  // ⚠️ 필수: 사용자 추적용 헤더
  'X-User-Id': user.loginid,           // 예: 'syngha.han'
  'X-User-Name': encodeURIComponent(user.username),  // 예: '%ED%95%9C%EC%8A%B9%ED%95%98' (한글 인코딩)
  'X-User-Dept': encodeURIComponent(user.deptname),  // 예: 'AI%ED%94%8C%EB%9E%AB%ED%8F%BC%ED%8C%80(DS%EB%B6%80%EB%AC%B8)'

  // ⚠️ 필수: 서비스 식별용 헤더
  'X-Service-Id': 'once-notes',        // Dashboard에 등록된 서비스 ID
};

// 예시: LLM 호출
const response = await fetch(`${LLM_PROXY_URL}/v1/chat/completions`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [...],
    stream: false,
  }),
});
```

### A.3 헤더 상세 설명
| 헤더 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `X-User-Id` | ✅ | 사용자 loginid | `syngha.han` |
| `X-User-Name` | ✅ | 사용자 이름 (URL 인코딩) | `%ED%95%9C%EC%8A%B9%ED%95%98` |
| `X-User-Dept` | ✅ | 부서명 (URL 인코딩) | `AI%ED%94%8C%EB%9E%AB%ED%8F%BC%ED%8C%80(DS%EB%B6%80%EB%AC%B8)` |
| `X-Service-Id` | ✅ | 서비스 식별자 | `once-notes` |

### A.4 사용량 수집 (Dashboard가 자동 처리)
```
Dashboard LLM Proxy가 자동으로 처리하는 항목:
1. User upsert (loginid, username, deptname, businessUnit)
2. UsageLog 저장 (userId, modelId, tokens, serviceId, latencyMs)
3. UserService 업데이트 (서비스별 사용자 활동 추적)
4. Redis 카운터 업데이트 (실시간 통계)
5. 활성 사용자 추적
```

### A.5 Dashboard 서비스 사전 등록
```
ONCE 서비스를 Dashboard에 미리 등록해야 함:
1. Dashboard 관리 페이지에서 서비스 등록
2. 서비스 ID: once-notes
3. 서비스명: ONCE
4. 모델 할당 (사용할 LLM 모델 연결)
```

### A.6 LLM Proxy 엔드포인트
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/v1/models` | 사용 가능한 모델 목록 |
| GET | `/v1/models/:name` | 특정 모델 정보 |
| POST | `/v1/chat/completions` | Chat Completion (LLM 호출) |
| GET | `/v1/health` | Health Check |

---

## 부록 B: 환경변수 전체 목록

```env
# ==================== 필수 ====================
NODE_ENV=production
PORT=16002

# Database
DATABASE_URL=postgresql://postgres:password@localhost:16003/once_notes

# Redis
REDIS_URL=redis://localhost:16004

# 인증
JWT_SECRET=your-very-long-secret-key-change-this
DEVELOPERS=syngha.han

# ==================== 외부 서비스 ====================
# Dashboard LLM Proxy
LLM_PROXY_URL=http://dashboard-api:3400/api/llm
LLM_SERVICE_ID=once-notes

# Knox Mail
KNOX_MAIL_URL=http://genai.samsungds.net:20080/knox/mail/send

# ==================== 설정 ====================
# 세션
SESSION_EXPIRES_HOURS=24

# Rate Limit
RATE_LIMIT_INPUT_PER_MINUTE=5
RATE_LIMIT_SEARCH_PER_MINUTE=10

# 큐
MAX_CONCURRENT_QUEUES=20
LLM_MAX_ITERATIONS=100

# 백업
BACKUP_PATH=/backups
BACKUP_RETENTION_DAYS=30

# History
HISTORY_RETENTION_DAYS=30
```

---

## 부록 C: Docker Compose 예시

```yaml
version: '3.8'

services:
  once:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "16001:80"
    environment:
      - VITE_API_URL=http://localhost:16002
    depends_on:
      - once-api

  once-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "16002:16002"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@once-db:5432/once_notes
      - REDIS_URL=redis://once-redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - DEVELOPERS=syngha.han
      - LLM_PROXY_URL=${LLM_PROXY_URL}
      - KNOX_MAIL_URL=http://genai.samsungds.net:20080/knox/mail/send
    depends_on:
      - once-db
      - once-redis

  once-db:
    image: postgres:15
    ports:
      - "16003:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=once_notes
    volumes:
      - once-db-data:/var/lib/postgresql/data

  once-redis:
    image: redis:7
    ports:
      - "16004:6379"
    volumes:
      - once-redis-data:/data

volumes:
  once-db-data:
  once-redis-data:
```

---

## 부록 D: 비판적 검토 결과

### D.1 확인된 핵심 요구사항
| 항목 | 상태 | 상세 |
|------|------|------|
| 서비스 목적 | ✅ | "작성하기 귀찮을 때 쓰는 지식 공유 서비스" |
| 사용자 수동 편집 불가 | ✅ | 섹션 1.2, 12.4, 14.4에 명시 |
| 3계층 구조 (사업부-팀-개인) | ✅ | 섹션 6.1에 상세 설명 |
| Dashboard 연동 | ✅ | 부록 A에 헤더 및 API 상세 기록 |
| docs-site 가이드 | ✅ | 섹션 1.4에 명시 (목적, 제약사항 포함) |

### D.2 Dashboard 코드 참조 완료
```
참조한 Dashboard 코드:
- ~/Dashboard/packages/api/src/routes/auth.routes.ts
  → SSO 인증 플로우, JWT 토큰 구조

- ~/Dashboard/packages/api/src/routes/proxy.routes.ts
  → LLM Proxy 헤더 (X-User-Id, X-User-Name, X-User-Dept, X-Service-Id)
  → extractBusinessUnit() 함수
  → 사용량 추적 로직

수정 범위 확인:
- Dashboard 코드 수정: ❌ (금지)
- Dashboard docs-site: ✅ (ONCE 가이드만 추가)
```

### D.3 잠재적 이슈 및 해결 방안
| 이슈 | 위험도 | 해결 방안 |
|------|--------|----------|
| deptname 형식이 다양할 수 있음 | 중 | 두 가지 형식 모두 지원 (괄호/슬래시) |
| 팀 이름 중복 가능성 | 저 | 사업부+팀명 조합으로 구분 |
| LLM 100회 초과 시 데이터 손실 | 저 | 중간 결과 저장 + 재시도 가능 |
| 동시 입력 시 충돌 | 저 | 큐 시스템으로 순차 처리 |

### D.4 상충되는 내용 없음
전체 문서 검토 결과 상충되는 내용 없음.

### D.5 docs-site 가이드 작성 체크리스트
```
Dashboard docs-site에 추가할 ONCE 가이드:
□ 서비스 소개
  □ "작성하기 귀찮을 때 쓰는 지식 공유 서비스"
  □ 사용 시나리오 (회의록, 아이디어, 지식 공유)
□ 시작하기
  □ SSO 로그인 방법
  □ 첫 노트 작성하기
□ 핵심 기능
  □ 뭐든지 입력 사용법
  □ 뭐든지 검색 사용법
  □ 다국어 전환
□ ⚠️ 중요 안내
  □ 사용자 수동 편집 불가 명확히 안내
  □ 수정 요청 방법 (예시 포함)
□ FAQ
  □ "노트를 직접 수정하고 싶어요" → 불가, 이유 설명
  □ "팀을 옮기면 노트는 어떻게 되나요?"
```

---

*문서 끝*

**최종 검토 완료: 2026-01-28**
**검토자: Claude (AI Assistant)**
**버전: 1.2.0**
