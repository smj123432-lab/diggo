# PROJECT_STATUS.md — Diggo 프로젝트 현황

> 이 파일 하나로 프로젝트 전체 흐름을 파악할 수 있도록 작성되었습니다.
> 새로운 대화창을 열 때 이 파일과 `PLAN.md`를 함께 참고하세요.

---

## 1. 프로젝트 개요

### 목적

굴착기 기사와 소장(현장 관리자)을 연결하는 배차 플랫폼.

기존 플랫폼과의 차별점은 두 가지다:
- **신뢰 검증**: 상호 평가 + 인증 뱃지로 경력을 속인 기사 문제, 나이 차별 문제를 해결한다.
- **전자장부**: 작업 완료 시 수입이 자동 기록되고, 유류비 등 지출을 직접 입력해 월별 순수익을 한눈에 확인한다. 수기 장부를 대체한다.

### 사용자 역할

| role | 설명 |
|------|------|
| `driver` | 굴착기 기사. 일감 조회/지원, 장부 관리. |
| `manager` | 소장. 일감 등록, 지원자 관리, 기사 평가. |
| `admin` | 관리자. 자격증 인증 승인, 신고 처리, 통계. |

### 기술 스택

| 분류 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | SSR/ISR로 일감 목록 SEO 대응 |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS | |
| 클라이언트 상태 | Zustand | 유저 세션, role 전역 관리 |
| 서버 상태 | TanStack Query v5 | 무한스크롤, 캐싱, Optimistic Update |
| DB / Auth | Supabase | RLS 역할별 접근제어, Auth 내장, Realtime |
| 지도 | 카카오맵 API | 주소 검색 + 지도 렌더링 (미구현) |
| 패키지 매니저 | Bun | |
| 배포 | Vercel | |

---

## 2. 폴더 구조 및 각 파일의 역할

```
diggo/
├── app/                          # Next.js App Router 루트
│   ├── layout.tsx                # 루트 레이아웃. Providers 래핑, 메타데이터 설정.
│   ├── page.tsx                  # 랜딩 페이지 (/). "일감 보기" / "로그인" 버튼.
│   ├── globals.css               # Tailwind directives, CSS 변수 (--background 등)
│   ├── providers.tsx             # 'use client'. TanStack Query QueryClientProvider 래핑.
│   │                             # staleTime 기본값 30초로 설정.
│   │
│   ├── (auth)/                   # 인증 라우트 그룹. 레이아웃 URL에 영향 없음.
│   │   ├── login/page.tsx        # 로그인 페이지 (/login). 구현 예정.
│   │   └── signup/page.tsx       # 회원가입 페이지 (/signup). 구현 예정.
│   │
│   ├── jobs/                     # 일감 관련 페이지
│   │   ├── page.tsx              # 일감 목록 (/jobs). revalidate 30초 (SSR).
│   │   ├── new/page.tsx          # 일감 등록 (/jobs/new). 소장 전용. 구현 예정.
│   │   └── [id]/page.tsx         # 일감 상세 (/jobs/[id]). revalidate 60초 (ISR).
│   │
│   ├── manager/                  # 소장 전용 페이지
│   │   └── jobs/
│   │       ├── page.tsx          # 내 등록 일감 목록 (/manager/jobs). 구현 예정.
│   │       └── [id]/applicants/
│   │           ├── page.tsx      # 지원자 목록. 구현 예정.
│   │           └── [applicationId]/page.tsx  # 지원자 상세. 구현 예정.
│   │
│   ├── mypage/                   # 마이페이지 (force-dynamic, 개인 데이터)
│   │   ├── page.tsx              # 마이페이지 홈 (/mypage). 구현 예정.
│   │   ├── edit/page.tsx         # 프로필 수정. 구현 예정.
│   │   ├── ledger/page.tsx       # 전자장부 (달력 + 지출 입력). 구현 예정.
│   │   ├── applications/page.tsx # 내 지원 목록. 구현 예정.
│   │   ├── reviews/page.tsx      # 받은 평가 목록. 구현 예정.
│   │   └── certifications/page.tsx # 자격증 관리 (v2). 구현 예정.
│   │
│   ├── chats/                    # 채팅 (v2)
│   │   ├── page.tsx              # 채팅 목록. 구현 예정.
│   │   └── [id]/page.tsx         # 채팅방. Supabase Realtime. 구현 예정.
│   │
│   ├── notifications/
│   │   └── page.tsx              # 알림 목록 (v2). 구현 예정.
│   │
│   ├── admin/
│   │   └── page.tsx              # 관리자 대시보드 (force-dynamic). 구현 예정.
│   │   # /admin/users, /admin/certifications, /admin/reports, /admin/jobs
│   │   # 폴더는 생성됨, page.tsx 미작성 (v2)
│   │
│   └── api/                      # API Routes (Next.js Route Handlers)
│       ├── jobs/
│       │   ├── route.ts           # GET 목록(필터/페이지네이션), POST 등록
│       │   ├── [id]/route.ts      # GET 상세, PATCH 수정/상태변경
│       │   └── mine/route.ts      # GET 소장의 내 일감 목록
│       ├── applications/
│       │   ├── route.ts           # GET 내 지원목록, POST 지원신청
│       │   └── [id]/status/route.ts  # PATCH 상태변경 (검토중→수락/거절)
│       │                               # 검토중 전환 시 chats 자동 생성
│       ├── profile/route.ts       # GET 내 프로필, PATCH 수정
│       ├── ledger/
│       │   ├── monthly/route.ts   # GET 월별 수입요약 (수입-지출 계산)
│       │   └── expenses/
│       │       ├── route.ts       # POST 지출 추가
│       │       └── [id]/route.ts  # DELETE 지출 삭제
│       ├── reviews/route.ts       # POST 평가 작성 (완료 일감에만)
│       ├── notifications/
│       │   ├── route.ts           # GET 알림 목록
│       │   └── read/route.ts      # PATCH 읽음 처리 (ids 배열 or 전체)
│       └── admin/                 # 관리자 API (폴더만 생성, route.ts 미작성)
│           ├── certifications/pending/
│           ├── certifications/[id]/
│           ├── reports/
│           ├── stats/
│           └── jobs/[id]/
│       # 미작성 route.ts: certifications, chats/[applicationId], messages/[chatId]
│       # (v2 기능이거나 다음 구현 순서)
│
├── components/                   # 공용 컴포넌트 (아직 비어 있음)
│   ├── ui/                       # 버튼, 입력창 등 기본 UI 컴포넌트
│   └── features/                 # 일감카드, 지원자카드 등 도메인 컴포넌트
│
├── hooks/
│   └── useAuth.ts                # 'use client'. Supabase auth 상태 구독 → Zustand store 동기화.
│                                  # 세션 확인 + onAuthStateChange 구독.
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient. 클라이언트 컴포넌트용.
│   │   └── server.ts             # createServerClient. 서버 컴포넌트 / API Routes용.
│   │                              # cookies()로 세션 읽기/쓰기.
│   └── utils/                    # 헬퍼 함수 (아직 비어 있음)
│
├── store/
│   └── auth.ts                   # Zustand 인증 스토어.
│                                  # user(Supabase User), profile(DB profiles 행),
│                                  # role(UserRole), isLoading 상태 관리.
│                                  # setProfile() 호출 시 role 자동 동기화.
│
├── types/
│   └── index.ts                  # 전체 TypeScript 타입 정의.
│                                  # Profile, Job, Application, Equipment,
│                                  # LedgerExpense, Review, Certification,
│                                  # Chat, Message, Notification.
│                                  # EQUIPMENT_LABELS, JOB_TYPE_LABELS 등 한글 레이블 상수 포함.
│
├── supabase/
│   └── schema.sql                # Supabase SQL Editor에서 실행할 전체 스키마.
│                                  # 테이블 10개, 트리거 2개, RLS 정책 전체,
│                                  # Realtime 활성화 (messages, notifications).
│
├── middleware.ts                  # Next.js 미들웨어. Supabase 세션 갱신 + 라우팅 보호.
│                                  # /mypage, /chats, /notifications, /manager, /admin
│                                  # → 미로그인 시 /login?redirect=<원래경로> 리디렉션.
│                                  # 이미 로그인된 상태에서 /login, /signup → / 리디렉션.
│
├── next.config.ts                 # Next.js 설정 (현재 기본값)
├── tailwind.config.ts             # Tailwind 설정. primary: #F59E0B (amber-500) 추가.
├── tsconfig.json                  # strict: true, paths: @/* → ./*
├── postcss.config.mjs
├── .eslintrc.json
├── .env.local.example             # 환경변수 템플릿 (아래 참고)
├── package.json
├── PLAN.md                        # 전체 기획서 (DB 설계, API 설계, 개발 순위 포함)
├── CLAUDE.md                      # Claude Code 작업 지침 (코딩 규칙, 캐싱 전략 등)
└── PROJECT_STATUS.md              # 이 파일
```

---

## 3. 지금까지 완료된 작업

### 세션 1 (2026-05-17)

#### 프로젝트 초기 세팅

Next.js 14 App Router 프로젝트를 Bun 기반으로 완전히 세팅했다. `create-next-app` 대신 모든 파일을 직접 작성해 Diggo 도메인에 최적화된 구조로 시작했다.

**완료된 항목:**

- [ x ] `package.json` 작성 및 `bun install` 완료 (391 packages)
- [ x ] TypeScript strict 모드 설정 (`tsconfig.json`)
- [ x ] Tailwind CSS 설정 (primary color: amber-500 #F59E0B)
- [ x ] Supabase SSR 클라이언트 설정 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ x ] Next.js 미들웨어 — 인증 보호 라우팅 + 세션 갱신
- [ x ] Zustand 인증 스토어 (`store/auth.ts`) — user, profile, role, isLoading
- [ x ] `useAuth` 훅 — Supabase onAuthStateChange 구독 → Zustand 동기화
- [ x ] TanStack Query Provider (`app/providers.tsx`) — staleTime 30초 기본값
- [ x ] TypeScript 타입 전체 정의 (`types/index.ts`) — 10개 인터페이스 + 한글 레이블 상수
- [ x ] 전체 페이지 라우트 폴더 구조 생성 (MVP 15페이지 + v2 경로 포함)
- [ x ] 랜딩 페이지 (`app/page.tsx`) — 기본 UI 완성
- [ x ] 인증 페이지 placeholder (`/login`, `/signup`)
- [ x ] 전체 도메인 페이지 placeholder (캐싱 전략 상수 포함)

**구현 완료된 API Routes:**

| 엔드포인트 | 메서드 | 내용 |
|-----------|--------|------|
| `/api/jobs` | GET | 일감 목록 (equipment_code, job_type, status 필터, 페이지네이션) |
| `/api/jobs` | POST | 일감 등록 (manager/admin만, revalidatePath 호출) |
| `/api/jobs/[id]` | GET | 일감 상세 (소장 프로필 join) |
| `/api/jobs/[id]` | PATCH | 일감 수정/상태변경 (본인 일감만) |
| `/api/jobs/mine` | GET | 소장의 내 일감 목록 |
| `/api/applications` | GET | 내 지원 목록 (jobs join) |
| `/api/applications` | POST | 지원 신청 (driver만, 중복 지원 409 처리) |
| `/api/applications/[id]/status` | PATCH | 검토중/수락/거절 전환. 검토중 시 chats 자동 생성 |
| `/api/profile` | GET | 내 프로필 조회 |
| `/api/profile` | PATCH | 프로필 수정 (id, role, rating_avg, is_certified 변경 불가) |
| `/api/ledger/monthly` | GET | 월별 수입요약 (총수입, 총지출, 순수익) |
| `/api/ledger/expenses` | POST | 지출 추가 |
| `/api/ledger/expenses/[id]` | DELETE | 지출 삭제 (본인만) |
| `/api/reviews` | POST | 평가 작성 (completed 일감만, 중복 409 처리) |
| `/api/notifications` | GET | 알림 목록 (최신 50건) |
| `/api/notifications/read` | PATCH | 읽음 처리 (ids 배열 or 전체) |

**DB 스키마 (`supabase/schema.sql`):**
- 테이블 10개: profiles, equipments, jobs, applications, ledger_expenses, reviews, certifications, chats, messages, notifications
- 트리거 2개
  - `on_auth_user_created`: 회원가입 시 profiles 자동 생성 (name, role을 `raw_user_meta_data`에서 읽음)
  - `on_review_created`: 평가 작성 시 `rating_avg` 자동 업데이트
- RLS 정책: 역할별 접근 제어 전체 작성
- Realtime: messages, notifications 테이블 활성화

---

## 4. 앞으로 남은 작업

### MVP 구현 순서 (PLAN.md 기준)

| 순서 | 작업 | 상태 |
|------|------|------|
| 1 | 프로젝트 세팅 + Supabase 테이블 + RLS | **완료** |
| 2 | 인증 (로그인 / 회원가입 / 역할 선택) | 미구현 |
| 3 | 일감 목록 + 필터 + 무한스크롤 | 미구현 |
| 4 | 일감 등록 폼 + 카카오맵 | 미구현 |
| 5 | 일감 상세 + 지원 신청 | 미구현 |
| 6 | 지원자 관리 (소장) | 미구현 |
| 7 | 장부 (달력 + 지출 입력) | 미구현 |
| 8 | 마이페이지 + 상호 평가 | 미구현 |
| 9 | 버그 수정 + 마무리 | 미구현 |

### 다음 작업 상세

#### 2단계: 인증 (`/login`, `/signup`)

- Supabase `signInWithPassword` / `signUp` 연동
- 회원가입 시 `raw_user_meta_data`에 `name`, `role` 포함해서 호출해야 트리거가 profiles 생성
- 역할 선택 UI (기사 / 소장 선택 → 회원가입 분기)
- `useAuth` 훅이 이미 완성돼 있어 로그인 성공 후 자동으로 Zustand store 동기화됨

#### 3단계: 일감 목록 (`/jobs`)

- TanStack Query `useInfiniteQuery` + `cursor` 기반 무한스크롤
- 필터 UI: 장비 종류(8종), 일감 유형(토목/철거), 날짜
- 서버에서 prefetch → `HydrationBoundary`로 hydrate하는 패턴 사용
- `JobCard` 컴포넌트 작성 필요 (`components/features/`)

#### 4단계: 일감 등록 폼 (`/jobs/new`)

- 카카오맵 API 연동 (주소 검색 Kakao Local API)
- 철거 시 추가 필드 (어태치먼트, 주의사항) 조건부 렌더링
- 등록 성공 후 `revalidatePath('/jobs')` 이미 API에 구현됨

#### 미구현 API Routes (v2 포함)

| 엔드포인트 | 우선순위 |
|-----------|---------|
| `GET /api/ledger/daily/[date]` | MVP |
| `POST /api/certifications` | v2 |
| `GET /api/chats/[applicationId]` | v2 |
| `GET /api/messages/[chatId]` | v2 |
| `POST /api/messages` | v2 |
| `GET /api/admin/certifications/pending` | v2 |
| `PATCH /api/admin/certifications/[id]` | v2 |
| `GET /api/admin/reports` | v2 |
| `GET /api/admin/stats` | v2 |
| `PATCH /api/admin/jobs/[id]` | v2 |

#### 미구현 컴포넌트

`components/ui/`와 `components/features/`가 비어 있다. 페이지를 구현하면서 점진적으로 채운다.

공통 UI 컴포넌트 후보:
- `Button`, `Input`, `Select`, `Badge`, `Modal`, `BottomSheet`

도메인 컴포넌트 후보:
- `JobCard` (일감 카드), `ApplicantCard` (지원자 카드)
- `LedgerCalendar` (장부 달력), `ExpenseForm` (지출 입력)
- `RatingStars` (별점 UI), `EquipmentBadge` (장비 뱃지)
- `BottomNav` (하단 내비게이션 — 모바일 타겟)

#### v2 기능

- 채팅 (Supabase Realtime)
- 자격증 인증 플로우 (Supabase Storage 업로드 + 관리자 승인)
- 알림 (Realtime 구독)
- 장비 여러 대 운용 (담당 기사 지정)
- 관리자 세부 페이지 (인증 목록, 신고 목록, 통계)

---

## 5. 중요한 결정사항 및 컨벤션

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `JobCard.tsx` |
| 훅 파일 | camelCase, `use` 접두사 | `useAuth.ts` |
| 유틸 함수 | camelCase | `formatDate.ts` |
| 타입/인터페이스 | PascalCase | `interface Profile` |
| 상수 | SCREAMING_SNAKE_CASE | `EQUIPMENT_LABELS` |
| DB 컬럼 | snake_case | `manager_id`, `pay_amount` |
| 주석 | 한국어 | `// 소장만 등록 가능` |

### Supabase 클라이언트 사용 규칙

클라이언트를 혼용하면 세션 불일치 버그가 발생하므로 엄격히 구분한다.

```
클라이언트 컴포넌트 ('use client')  → lib/supabase/client.ts (createBrowserClient)
서버 컴포넌트, API Routes, middleware → lib/supabase/server.ts (createServerClient)
```

### 캐싱 전략

페이지 성격에 따라 Next.js 렌더링 전략을 다르게 적용한다.

| 페이지 유형 | 전략 | 이유 |
|------------|------|------|
| 일감 목록 `/jobs` | `export const revalidate = 30` | SEO 필요, 30초 허용 지연 |
| 일감 상세 `/jobs/[id]` | `export const revalidate = 60` | ISR, 공유 링크 미리보기 |
| 마이페이지, 장부 | `export const dynamic = 'force-dynamic'` | 개인 데이터, 캐싱 불가 |
| 관리자 | `export const dynamic = 'force-dynamic'` | 항상 최신 데이터 필요 |

일감 등록/수정 후에는 반드시 `revalidatePath('/jobs')`를 호출해야 캐시가 즉시 무효화된다. API에 이미 구현됨.

### 상태 관리 분리

- **Zustand (`store/auth.ts`)**: 앱 전역에서 필요한 인증 상태. user, profile, role. 서버 요청 없이 어디서든 읽는다.
- **TanStack Query**: 서버 데이터(일감 목록, 프로필 등). 캐싱, 무한스크롤, Optimistic Update 담당.
- **두 가지를 섞지 않는다**: Zustand에 일감 데이터를 넣거나, TanStack Query에 인증 상태를 넣지 않는다.

### API Route 에러 처리 패턴

모든 API Route는 동일한 패턴을 따른다:

```ts
// 1. 인증 확인
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

// 2. 역할 확인 (필요한 경우)
if (profile?.role !== 'manager') return NextResponse.json({ error: '...' }, { status: 403 })

// 3. 비즈니스 로직
const { data, error } = await supabase.from(...).select(...)
if (error) throw error  // catch 블록에서 처리

// 4. 성공 응답
return NextResponse.json({ data })
```

에러 응답 형태: `{ error: '한국어 메시지' }` + HTTP 상태 코드.
성공 응답 형태: `{ data: ... }` (목록은 `{ data, count, page, limit }`).

### DB 설계 핵심 결정사항

- **profiles.id = auth.users.id**: 별도의 user_id FK 없이 UUID를 그대로 사용. `on_auth_user_created` 트리거로 자동 생성.
- **applications에 unique(job_id, driver_id)**: DB 레벨에서 중복 지원 방지. API에서 23505 에러 코드로 409 응답.
- **reviews에 unique(job_id, reviewer_id)**: 같은 일감에 평가 중복 방지.
- **chats는 application_id와 1:1**: `application_id UNIQUE` 제약으로 채팅방 중복 생성 방지.
- **채팅방 생성 시점**: `PATCH /api/applications/[id]/status`에서 status를 `reviewing`으로 변경할 때 chats 행도 함께 INSERT.

### 환경변수

```bash
# .env.local (로컬 개발용, .gitignore에 포함됨)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your-kakao-app-key
```

`NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트에 노출된다. Supabase anon key는 RLS로 보호되므로 공개해도 안전하다.

### Supabase DB 설정 순서

처음 Supabase 프로젝트를 연결할 때는 아래 순서로 진행한다:

1. Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 전체 실행
2. Authentication → Settings에서 이메일 인증 설정 확인
3. Storage → 버킷 생성 (자격증 이미지용, v2)
4. `.env.local.example`을 `.env.local`로 복사 후 키 입력

---

## 참고 문서

- `PLAN.md` — 전체 기획서. DB 스키마, API 설계, 개발 우선순위 포함.
- `CLAUDE.md` — Claude Code 작업 지침. 코딩 규칙, 캐싱 전략, 명령어.
- `supabase/schema.sql` — 실행 가능한 전체 DB 스키마 + RLS 정책.
- `types/index.ts` — 전체 TypeScript 타입 정의 및 한글 레이블 상수.
