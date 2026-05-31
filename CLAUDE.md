# Diggo — 굴착기 배차 플랫폼

## 프로젝트 개요

굴착기 기사와 소장을 연결하는 배차 플랫폼.
기사는 일감을 찾고, 소장은 검증된 기사를 구한다.
전자장부 기능으로 수기 장부 문제를 해결한다.

## 기술 스택

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (DB, Auth, Realtime, Storage)
- Zustand (클라이언트 상태관리 - 유저 세션, role)
- TanStack Query v5 (서버 상태관리, 무한스크롤, 캐싱)
- Bun (패키지 매니저, 런타임)
- Vercel (배포)
- 카카오맵 API (주소 검색, 지도 렌더링)

## 주요 명령어

- 개발 서버 실행: bun dev
- 빌드: bun run build
- 패키지 설치: bun add [패키지명]
- 타입 체크: bun run type-check

## 폴더 구조

```
diggo/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 로그인, 회원가입
│   ├── jobs/               # 일감 목록, 상세
│   ├── manager/            # 소장 전용 페이지
│   ├── mypage/             # 마이페이지, 장부
│   ├── chats/              # 채팅
│   ├── admin/              # 관리자
│   └── api/                # API Routes
├── components/             # 공통 컴포넌트
│   ├── ui/                 # 기본 UI 컴포넌트
│   └── features/           # 기능별 컴포넌트
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티
│   ├── supabase/           # Supabase 클라이언트
│   └── utils/              # 헬퍼 함수
├── store/                  # Zustand 스토어
├── types/                  # TypeScript 타입 정의
├── PLAN.md                 # 전체 기획서
└── CLAUDE.md               # 이 파일
```

## 사용자 역할 (role)

- driver: 굴착기 기사
- manager: 소장 (일감 등록자)
- admin: 관리자

## 장비 종류 (equipment_code)

- 008: 008 (미니)
- 017: 017
- 035: 035
- 02: 02
- 3w: 3w (휠)
- 6w: 6w (휠)
- 8w: 8w (휠)
- 10t: 10t

## 일감 유형 (job_type)

- civil: 일반 토목
- demolition: 철거

## 코딩 규칙

- 신규 파일 작성 시: 항상 전체 코드 작성
- 기존 파일 수정 시: 수정 부분만 작성 (토큰 절약)
- TypeScript strict 모드 사용
- 컴포넌트는 함수형으로 작성
- 서버 컴포넌트와 클라이언트 컴포넌트를 명확히 구분
- 'use client' 는 꼭 필요한 경우에만 사용
- 에러 처리는 항상 포함
- 주석은 한국어로 작성
- API Routes는 app/api/ 하위에 작성
- Supabase 클라이언트는 lib/supabase/ 에서 import

## 캐싱 전략 (Next.js 16 cacheComponents)

- `next.config.mjs`에 `cacheComponents: true` 활성화
- 공개 데이터: `lib/utils/jobs-cache.ts`에서 `"use cache"` + `cacheLife` + `cacheTag` 사용
  - `getCachedJobsFirstPage()` — `cacheLife('seconds')`, `cacheTag('jobs')`
  - `getCachedJobDetail(id)` — `cacheLife('minutes')`, `cacheTag('jobs')`
- `createPublicClient()`: cookies() 없음 → "use cache" 함수에서 전용 사용
- `createClient()`: `'use no-store'` 선언 → 호출하는 모든 서버 컴포넌트를 자동 dynamic 처리
- 캐시 무효화: `revalidateTag('jobs', 'max')` (Next.js 16은 두 번째 인자 필수)
- 인증 필요 페이지: force-dynamic 제거 → createClient()의 use no-store로 자동 처리
- 사용자별 UI(`UserJobSection`): 'use client' + useAuthStore로 클라이언트에서 처리
- 채팅/알림: Supabase Realtime

## Supabase 관련

- 클라이언트 사이드: createBrowserClient
- 서버 사이드: createServerClient
- RLS 정책으로 역할별 접근 제어
- Realtime으로 채팅, 알림 구현

## 작업 시 참고사항

- PLAN.md에 전체 기획, DB 설계, API 설계가 있다
- MVP 범위를 먼저 완성하고 v2 기능은 나중에 추가
- 페이지 단위로 하나씩 완성한다
- 작업 전 반드시 PLAN.md를 참고한다

## 브랜치 전략

- main: 배포용. 직접 커밋 금지. Vercel 자동 배포 연결.
- dev: 개발 통합 브랜치. 기능 완성 후 여기에 머지.
- feat/기능명: 기능 개발 (예: feat/login, feat/job-list)
- fix/버그명: 버그 수정 (예: fix/auth-redirect)

## 커밋 컨벤션

- feat: 새 기능
- fix: 버그 수정
- style: UI/스타일 수정
- refactor: 리팩토링
- chore: 설정, 패키지
- docs: 문서 수정
- 예시: feat: 일감 목록 무한스크롤 구현
- 커밋 메시지는 한국어로 작성

## 컴포넌트 규칙

- 서버 컴포넌트 기본, 'use client'는 꼭 필요할 때만
- props 타입은 interface로 정의 (type 말고)
- 컴포넌트 파일 상단에 역할 한 줄 주석 작성
- 스타일은 Tailwind만 사용 (인라인 style 금지)
- 로딩 상태와 에러 상태 UI 항상 포함

## 네이밍 규칙

- 컴포넌트 파일: PascalCase (JobCard.tsx)
- 훅 파일: camelCase + use 접두사 (useJobList.ts)
- 유틸 함수: camelCase (formatDate.ts)
- 타입/인터페이스: PascalCase (interface Profile)
- 상수: SCREAMING_SNAKE_CASE (EQUIPMENT_LABELS)
- DB 컬럼: snake_case (manager_id, pay_amount)
- 주석: 한국어

## 에러 처리 패턴

- API Route는 항상 try/catch 사용
- 에러 응답: { error: '한국어 메시지' } + HTTP 상태코드
- 성공 응답: { data: ... } (목록은 { data, count, page, limit })
- 401: 로그인 필요, 403: 권한 없음, 404: 없음, 409: 중복

## 금지 사항

- any 타입 사용 금지 (unknown 사용)
- console.log 금지 (console.error만 허용)
- 인라인 style 금지
- 신규 파일 외 전체 코드 불필요하게 반복 금지
- 하드코딩 금지 (상수는 types/index.ts에 정의)
- TODO 주석 남기기 금지 (구현하거나 삭제)

## 작업 시작 전 체크리스트

- 반드시 작업 전 브랜치 확인: git branch
- 새 기능은 반드시 feat/기능명 브랜치에서 작업
- main, dev 브랜치에 직접 커밋 금지
- 브랜치 없이 작업 요청하면 먼저 브랜치 생성 안내해줘

## 언어

- 모든 응답과 주석은 한국어로 작성한다

## 트러블슈팅

### Supabase 회원가입 500 에러 — Database error saving new user

**증상**: `POST /auth/v1/signup` → 500, `{"error_code":"unexpected_failure","msg":"Database error saving new user"}`

**원인**: `handle_new_user` 트리거 함수에 `search_path`가 지정되지 않아, Supabase Auth 환경에서 `profiles` 테이블을 찾지 못해 실패.

**해결**: 트리거 함수 정의에 `set search_path = public` 추가

```sql
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
...
$$;
```

> Supabase에서 `security definer` 함수는 반드시 `set search_path = public`을 명시해야 Auth 환경에서 정상 동작한다.

### Supabase profiles 조회 403 에러

**증상**: `GET /rest/v1/profiles` → 403, role이 null이라 UI 업데이트 안 됨

**원인**: RLS 정책만 있고 `anon`/`authenticated` 롤에 테이블 SELECT 권한이 없음. SQL로 직접 테이블 생성 시 권한을 별도로 부여해야 함.

**해결**: Supabase SQL Editor에서 실행
```sql
grant select on profiles to anon, authenticated;
```

> Supabase UI로 테이블 생성 시 권한이 자동 부여되지만, SQL로 직접 생성하면 반드시 수동으로 grant 해야 한다.

### sonner 토스트에서 줄바꿈

**증상**: `\n` 문자가 줄바꿈으로 렌더링되지 않음

**해결**: 문자열 대신 JSX 사용
```tsx
toast.error(<>첫 번째 줄<br />두 번째 줄</>)
```

### AuthInitializer 전역 초기화 패턴

Supabase 인증 구독(`useAuth`)은 앱 전체에서 한 번만 호출해야 중복 API 요청이 없다.
`components/features/auth/AuthInitializer.tsx`를 만들고 `providers.tsx`에 삽입.
나머지 컴포넌트는 `useAuthStore()`로 Zustand 상태만 읽는다.

### useAuth — isLoading 빠른 해제

`onAuthStateChange`가 로컬 세션을 즉시 확인하므로, 프로필 fetch 완료를 기다리지 않고 세션 확인 직후 `setIsLoading(false)` 호출.
프로필(role)은 백그라운드에서 별도 fetch해 store에 업데이트한다.

### Supabase 테이블 INSERT/UPDATE 권한 없음 — 42501

**증상**: `POST /api/jobs` → 500, 서버 로그에 `permission denied for table jobs (code: 42501)`

**원인**: SQL로 직접 생성한 테이블은 `authenticated` 롤에 INSERT/UPDATE 권한이 자동 부여되지 않음. SELECT와 마찬가지로 수동 grant 필요.

**해결**: Supabase SQL Editor에서 실행
```sql
GRANT INSERT, SELECT, UPDATE ON public.jobs TO authenticated;
```

> SQL로 생성한 테이블은 작업에 필요한 모든 권한(SELECT / INSERT / UPDATE / DELETE)을 롤별로 명시적으로 부여해야 한다.

### 카카오 로컬 API 403 — OPEN_MAP_AND_LOCAL 미활성화

**증상**: `/api/address/search` 호출 시 카카오 API에서 403 반환, 주소 검색 결과 없음

**원인**: 카카오 개발자 콘솔에서 해당 앱의 `지도/로컬(OPEN_MAP_AND_LOCAL)` 서비스가 활성화되어 있지 않음. REST API 키가 존재해도 서비스 미활성화 시 호출 불가.

**해결**: [카카오 개발자 콘솔](https://developers.kakao.com) → 앱 선택 → 활성화된 서비스 → `지도/로컬` 활성화

> 프로젝트마다 서비스를 개별 활성화해야 한다. 다른 프로젝트에서 활성화한 키는 해당 앱에서만 유효하므로, 새 프로젝트에는 반드시 별도로 활성화해야 한다.

### 카카오 REST API 키 — 서버 전용 처리

**증상**: `NEXT_PUBLIC_KAKAO_REST_API_KEY`를 클라이언트에서 직접 사용 시 키 노출 위험

**해결**: REST API 키는 `KAKAO_REST_API_KEY`(NEXT_PUBLIC 없이)로 환경변수 설정 후, API Route(`/api/address/search`)를 프록시로 두고 서버에서만 호출.

```
클라이언트 → /api/address/search?q=... → 서버에서 카카오 API 호출 → 결과 반환
```

> `NEXT_PUBLIC_` 접두사가 붙은 환경변수는 브라우저에 노출된다. 외부 API 키는 반드시 서버 전용 환경변수로 관리한다.

### KakaoMap SDK — 모달/드롭다운이 지도 뒤에 숨는 z-index 버그

**증상**: `fixed` / `absolute` 포지션 요소(모달, 드롭다운)가 카카오맵 위에 렌더링되지 않고 지도 뒤로 숨거나, 지도가 모달 위로 튀어나옴

**원인**: 카카오맵 SDK가 컨테이너 부모 요소에 `transform` CSS를 적용해 새로운 stacking context를 생성. `fixed` 포지션이 viewport 기준이 아닌 이 context 기준으로 계산되어 z-index가 의도대로 동작하지 않음.

**해결**: `createPortal(content, document.body)`로 렌더링 위치를 카카오맵 부모 DOM 트리 바깥으로 분리.

```tsx
import { createPortal } from 'react-dom'

return createPortal(
  <div className="fixed inset-0 z-50">...</div>,
  document.body
)
```

> 카카오맵이 있는 페이지에서 모달·드롭다운·토스트 등은 항상 `createPortal`을 사용할 것.

### 커스텀 드롭다운 — 옵션 클릭 시 선택 안 되고 닫히는 mousedown/click 레이스 컨디션

**증상**: 드롭다운 옵션을 클릭해도 선택되지 않고 드롭다운만 닫힘

**원인**: 바깥 클릭 감지에 `mousedown` 이벤트를 사용할 때, `mousedown`이 `click`보다 먼저 발화되어 드롭다운이 언마운트됨. 그 결과 옵션 버튼의 `onClick`이 발화되지 않음.

**해결**: 바깥 클릭 핸들러에서 드롭다운 내부 클릭은 무시하도록 `dropdownRef` 추가.

```tsx
const dropdownRef = useRef<HTMLDivElement>(null)

function onOutside(e: MouseEvent) {
  const t = e.target as Node
  if (!btnRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
    setIsOpen(false)
  }
}
document.addEventListener('mousedown', onOutside)
```

> `btnRef`만 체크하고 `dropdownRef`를 빠뜨리면 이 버그가 반드시 발생한다.

### 커스텀 드롭다운 — stacking context에 막혀 드롭다운이 보이지 않는 버그

**증상**: 드롭다운 버튼 클릭 시 드롭다운이 열리지 않거나 보이지 않음

**원인**: 부모 요소의 `overflow: hidden`, `transform`, `position` 등이 새 stacking context를 형성해 드롭다운이 잘리거나 다른 요소 뒤에 숨음.

**해결**: `createPortal` + `getBoundingClientRect()`로 버튼 위치를 계산해 `document.body`에 절대좌표로 렌더링.

```tsx
function openDropdown() {
  const rect = btnRef.current?.getBoundingClientRect()
  if (!rect) return
  setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
  setIsOpen(true)
}

// portal로 렌더링
createPortal(
  <div style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}>
    ...
  </div>,
  document.body
)
```

### jobs status CHECK 제약 조건 — 새 상태값 추가 시 DB 500 에러

**증상**: 새 `status` 값(예: `'settled'`)으로 PATCH 요청 시 500 에러 발생

**원인**: `jobs` 테이블의 `status` 컬럼에 CHECK 제약 조건이 있어 허용되지 않은 값은 DB에서 거부됨. TypeScript 타입과 프론트엔드 코드만 수정하면 DB에서 차단됨.

**해결**: 새 상태값 추가 시 반드시 Supabase SQL Editor에서 제약 조건도 갱신.

```sql
ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_status_check
    CHECK (status IN ('open', 'closed', 'in_progress', 'completed', 'settled'));
```

> `types/index.ts`의 `JobStatus` 타입 변경 시 DB CHECK 제약 조건도 반드시 함께 변경할 것.

### 공용 일감 목록 — 날짜 지난 open 일감이 "마감"으로 표시되며 노출

**증상**: 공용 목록(`/jobs`)에 "마감" 표시된 카드가 노출됨

**원인**:
1. API 기본 필터가 `status IN ('open', 'closed')`여서 마감 일감까지 포함됨
2. `work_date`가 오늘 이전인 `open` 일감은 `JobCard`에서 effectiveStatus 계산으로 "마감" 표시됨

**해결**: 공용 목록 API와 SSR 프리페치에 `status = 'open' AND work_date >= today` 조건 적용. 개인 대시보드(`/api/jobs/mine`)는 상태 필터 없이 전체 유지.

```typescript
// /api/jobs/route.ts — 공용 목록 기본 필터
const today = new Date().toISOString().split('T')[0]
query = query.eq('status', 'open').gte('work_date', today)

// /api/jobs/mine/route.ts — 상태 필터 없음 (전체 상태 조회)
```

> 공용 탐색 화면과 개인 대시보드의 필터링 조건을 반드시 분리해야 한다.

### 금액 컬럼 int4 overflow — 큰 금액 INSERT 시 DB 500 에러

**증상**: 금액 입력 후 저장 시 500 에러 발생 (특히 10억 이상)

**원인**: Supabase PostgreSQL `int4` 컬럼의 최대값은 2,147,483,647. 클라이언트에서 최대값 제한 없이 전송하면 DB에서 overflow 에러 발생.

**해결**: 클라이언트 입력 시 999,999,999 이하로 클램프 처리.

```typescript
const clamped = num > 999_999_999 ? 999_999_999 : num
```

> `int4` 컬럼을 사용하는 금액 필드는 반드시 클라이언트에서 최대값을 제한해야 한다. 서버 유효성 검사에도 동일 조건 추가.

### 달력 셀 대형 금액 레이아웃 깨짐 — 컴팩트 포맷으로 해결

**증상**: 달력 셀에 "1,200,000원" 같은 긴 금액이 셀 밖으로 넘쳐 레이아웃 붕괴

**원인**: 달력 셀은 공간이 매우 협소해 전체 금액 문자열을 수용 불가.

**해결**: 단위 축약 포맷 함수(`formatKRWCompact`, `formatCellBadge`) 사용. 셀 배지에는 "1만", "123만", "1.0억" 형태로 표시.

```typescript
// 달력 배지용 (부호 포함, "원" 없음)
function formatCellBadge(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount >= 0 ? '+' : '-'
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000)}만`
  return `${sign}${abs.toLocaleString()}`
}
```

> 공간이 제한된 UI(달력 셀, 배지, 카드 한 줄)에서는 항상 컴팩트 포맷을 사용할 것. `truncate` + `whitespace-nowrap`만으로는 레이아웃이 보장되지 않는다.

### 비밀번호 찾기 — 미가입 이메일도 성공 화면으로 전환되는 버그

**증상**: 가입되지 않은 이메일 입력 시에도 "메일을 확인해 주세요" 성공 화면으로 전환됨

**원인**: Supabase의 "Protect against user enumeration attacks" 옵션이 기본 On. 이 상태에서 `supabase.auth.resetPasswordForEmail()`은 이메일 존재 여부와 무관하게 항상 `error: null`을 반환하도록 설계됨.

**해결**: 클라이언트에서 직접 `resetPasswordForEmail`을 호출하지 않고, API Route를 통해 서버에서 먼저 유저 존재 여부를 확인.

```typescript
// app/api/auth/reset-password/route.ts
// Supabase admin REST API로 이메일 존재 여부 확인 (SDK의 getUserByEmail은 v2.105.4 미존재)
const checkRes = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&per_page=5`,
  { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
)
const { users } = await checkRes.json()
const exists = Array.isArray(users) && users.some(u => u.email === email)
if (!exists) return NextResponse.json({ error: '가입되지 않은 이메일 주소입니다.' }, { status: 404 })
```

> `auth.admin.getUserByEmail()`은 `@supabase/supabase-js` v2.105.4에 존재하지 않는다. admin REST API를 직접 fetch해야 하며, `filter` 파라미터는 like 검색이므로 반환된 결과에서 정확한 이메일 일치 여부를 재확인해야 한다.

### Next.js 16 cacheComponents — force-dynamic 호환 불가

**증상**: `cacheComponents: true` 적용 후 빌드 시 "Route segment config 'dynamic' is not compatible with `nextConfig.cacheComponents`" 에러

**원인**: `cacheComponents` 모드에서는 `export const dynamic = 'force-dynamic'` 선언이 금지됨. 새로운 캐싱 패러다임과 구형 세그먼트 설정이 충돌.

**해결**: `force-dynamic` 전체 제거. `createClient()` 함수에 `'use no-store'` 선언 추가 → 이 함수를 호출하는 모든 서버 컴포넌트가 자동으로 uncached(dynamic) 처리됨.

```typescript
export async function createClient() {
  'use no-store'  // 이 함수를 호출하는 서버 컴포넌트 = 자동 force-dynamic
  const cookieStore = await cookies()
  // ...
}
```

### Next.js 16 cacheComponents — revalidateTag 두 번째 인자 필수

**증상**: `revalidateTag('jobs')` 호출 시 "Expected 2 arguments, but got 1" 타입 에러

**원인**: Next.js 16에서 `revalidateTag(tag, profile)` 시그니처로 변경됨. 두 번째 인자(cache life profile)가 필수.

**해결**: `revalidateTag('jobs', 'max')` 형태로 두 번째 인자 추가.

### Next.js 16 cacheComponents — "use cache" 활성화 플래그명 변경

**증상**: `experimental.dynamicIO: true` → "Unrecognized key", `experimental.cacheComponents: true` → "has been moved"

**원인**: Next.js 버전마다 플래그명이 달라짐.
- Next.js 15 일부: `experimental.dynamicIO`
- Next.js 16: `cacheComponents` (experimental 바깥으로 승격)

**해결**: `next.config.mjs`에서 최상위에 `cacheComponents: true` 선언.

```javascript
const nextConfig = {
  cacheComponents: true,  // experimental 아님
  // ...
}
```

### Next.js 16 — params가 Promise 타입으로 변경

**증상**: 라우트 핸들러/페이지에서 `params.id` 접근 시 타입 에러 또는 런타임 에러

**원인**: Next.js 15/16에서 `params`가 `{ id: string }` → `Promise<{ id: string }>`로 변경됨.

**해결**: 타입 선언 변경 + `await params` 추가.

```typescript
// 변경 전
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

// 변경 후
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
```

> 동적 라우트를 가진 모든 page.tsx, route.ts 파일에 동일하게 적용해야 한다.

### Next.js 16 cacheComponents — Uncached data outside Suspense 빌드 에러

**증상**: `cacheComponents: true` 후 빌드 시 "Uncached data was accessed outside of <Suspense>" 에러

**원인**: `cacheComponents` 모드에서는 cookies() 등 동적 데이터를 접근하는 서버 컴포넌트가 Suspense 경계 안에 있어야 함. 루트 레이아웃의 `{children}`이 Suspense 없이 렌더되면 해당 페이지 전체가 에러.

**해결**: 루트 `layout.tsx`의 `children`을 `<Suspense>`로 감싸기.

```tsx
// app/layout.tsx
<Providers>
  <Suspense>{children}</Suspense>
</Providers>
```

### SSR 정렬과 클라이언트 re-fetch 정렬 불일치 — staleTime 만료 후 리스트 순서 교체

**증상**: `/jobs` 페이지 진입 30초 후 포커스 전환 시 일감 목록 순서가 갑자기 바뀜

**원인**: 서버 프리페치(`prefetchInfiniteQuery`)는 `created_at DESC`(최신 등록순)으로 정렬하지만, 클라이언트 `DEFAULT_FILTERS.sortBy = 'deadline'`(마감임박순, `work_date ASC`)이어서 두 정렬 기준이 달랐다. TanStack Query의 `staleTime: 30s` 만료 후 포커스 이벤트가 발생하면 클라이언트가 `/api/jobs?sortBy=deadline`으로 재fetch하여 서버에서 내려온 초기 데이터와 순서가 교체됨. Hydration 직후 즉각 발생하는 현상이 아니라 staleTime 만료 시점에 트리거되는 버그.

**해결**: `lib/utils/jobs-cache.ts`의 `getCachedJobsFirstPage()`에서 `order('work_date', { ascending: true })`로 통일. 서버 프리페치와 클라이언트 re-fetch가 동일한 정렬 기준을 사용하므로 순서 교체 없음.

```typescript
// 변경 전 (서버 프리페치)
.order('created_at', { ascending: false })  // 최신 등록순

// 변경 후 (DEFAULT_FILTERS.sortBy = 'deadline'과 일치)
.order('work_date', { ascending: true })    // 마감임박순
```

> 서버 SSR 프리페치와 클라이언트 TanStack Query의 `queryKey`, `정렬 기준`, `필터 조건`이 완전히 일치해야 한다. 불일치 시 staleTime 만료 후 리스트가 교체되는 UX 버그 발생.
