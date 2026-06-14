# Diggo

굴착기 기사와 소장을 연결하는 배차 플랫폼. 배차 확정 이후 일방적 취소에는 패널티가 부과되고, 작업이 완료되면 장부에 금액이 자동으로 기록된다.

**배포 링크**: [https://diggo-zr4b.vercel.app](https://diggo-zr4b.vercel.app)

---

## 💡 개발 배경

굴착기 기사와 소장을 모두 경험한 입장에서 이 플랫폼이 왜 필요한지는 몸으로 먼저 알았다.

기사로 일할 때 가장 힘들었던 건 노쇼였다. 새벽 다섯 시에 일어나 현장에 도착했는데 소장이 연락도 없이 나타나지 않는 경우가 있었다. 반대의 경우도 마찬가지였다. 소장 입장에서 기사를 섭외했는데 당일 아침에 연락이 끊기면 장비를 급하게 구하러 뛰어다녀야 했다. 어느 쪽이 취소를 해도 책임을 지는 구조가 없었다. 아는 사람끼리 일하는 관행 탓에 나쁜 이력이 쌓여도 대부분 흐지부지 넘어갔다.

수기 장부는 또 다른 문제였다. 현장 소장들이 두꺼운 노트에 날짜, 기사 이름, 금액을 손으로 적고 월말에 합산해서 정산하는 광경을 직접 여러 번 봤다. 기사 여럿을 쓰는 현장에서 누가 얼마를 받았는지, 어느 날 이체를 했는지 수기로 관리하는 건 실수가 잦을 수밖에 없었다. 기사도 자신이 언제 얼마를 받아야 하는지 따로 기록해두지 않으면 나중에 확인이 어려웠다.

개발을 공부하면서 이 두 가지 문제를 시스템으로 풀어보고 싶었다. 배차 확정 후 일방적 취소에 누적 제재가 붙는 구조, 작업이 완료되면 장부에 금액이 자동으로 올라가는 구조. Diggo는 거기서 출발했다.

---

## 🔗 프로젝트 소개

| 항목 | 내용 |
|------|------|
| 배포 URL | [https://diggo-zr4b.vercel.app](https://diggo-zr4b.vercel.app) |
| 개발 기간 | 2026.05 ~ 진행 중 |
| 개발 인원 | 1인 (풀스택) |

**테스트 계정**

| 역할 | 이메일 | 비밀번호 |
|------|--------|---------|
| 기사 | test@naver.com | test1234! |
| 소장 | manager1234@naver.com | manager1234! |
| 관리자 | admin1234@naver.com | admin1234! |

**서비스 흐름**

```
소장이 일감 등록 (장비 종류, 작업일, 지급 금액, 지급 예정일)
  → 기사가 목록에서 조회 후 장비 선택하여 지원
  → 소장이 지원자를 검토중 전환 → 채팅방 자동 생성
  → 채팅으로 현장 세부 협의
  → 소장 수락 → 배차 확정 (applications.status = accepted)
  → 작업 완료 후 상호 평가
  → 평점 재집계 → is_certified 조건 충족 시 자동 뱃지 부여
  → 소장이 정산 완료 처리 → 기사 장부에 지급 완료 반영
```

---

## 🎬 주요 기능 시연

### A. 기사 자진 취소 및 패널티 누적 플로우

배차 확정 후 기사가 일방적으로 취소하면 해당 기사의 `penalty_count`가 1 증가한다. 누적이 임계값에 도달하면 `banned_until` 타임스탬프가 자동으로 설정되고 지원 버튼이 제한 안내로 전환된다.

![기사 취소 패널티 플로우](docs/gifs/driver-cancel-penalty.gif)

---

### B. 소장 임의 배차 취소 및 패널티 누적 플로우

소장이 수락된 기사를 임의로 취소하면 소장의 `penalty_count`가 증가한다. 기사 카드와 일감 목록에 패널티 뱃지가 표시되어 다른 기사들이 사전에 확인할 수 있다.

![소장 취소 패널티 플로우](docs/gifs/manager-cancel-penalty.gif)

---

### C. 우수 기사 평점 자동 인증 뱃지 획득 플로우

리뷰 작성 시 서버에서 대상자의 전체 평점을 재집계한다. `rating_avg >= 4.5` 이면서 `review_count >= 5`를 동시에 충족하면 `is_certified`가 자동으로 `true`로 전환되고, 다음 페이지 로드 시 우수 평점 뱃지가 표시된다.

![우수 기사 인증 플로우](docs/gifs/auto-certified-badge.gif)

---

### D. 통합 현장 장부 지출 추가 및 낙관적 업데이트 플로우

지출 항목 추가 시 TanStack Query의 낙관적 업데이트가 먼저 UI에 반영된다. 서버 응답이 오기 전에 달력과 요약 카드가 갱신되며, 실패 시 이전 상태로 자동 복원된다.

![장부 낙관적 업데이트 플로우](docs/gifs/ledger-optimistic-update.gif)

---

## 🛠️ 기술 스택

| 분류 | 기술 | 선택 이유 |
|------|------|----------|
| 프레임워크 | Next.js 16 (App Router) | `cacheComponents: true` 기반 PPR(Partial Prerender) 지원. 공개 일감 목록은 정적 캐시, 사용자별 UI는 클라이언트에서 분리 처리 가능 |
| 언어 | TypeScript (strict) | 역할별 타입(`driver`, `manager`, `admin`), 일감 상태 타입(`ApplicationStatus`), 패널티 임계값 상수(`PENALTY_BAN_THRESHOLDS`) 등 도메인 규칙을 타입 레벨에서 강제 |
| 스타일 | Tailwind CSS | 모바일 반응형 레이아웃을 빠르게 구성. 인라인 `style` 속성 없이 조건부 클래스만으로 상태 기반 UI 분기 처리 |
| 데이터베이스 | Supabase (PostgreSQL) | RLS 정책으로 역할별 데이터 접근을 DB 레벨에서 통제. `CHECK` 제약 조건으로 허용되지 않은 상태값 DB 단에서 차단 |
| 실시간 | Supabase Realtime | 채팅 메시지, 알림, 읽음 처리를 WebSocket으로 구현. 채팅방마다 고유 채널명으로 싱글톤 캐시 충돌 방지 |
| 서버 상태 | TanStack Query v5 | 일감 목록 무한스크롤, 낙관적 업데이트(장부 지출), `HydrationBoundary` 패턴으로 SSR 워터폴 방지 |
| 클라이언트 상태 | Zustand | 유저 세션과 역할(role)을 전역에서 단일 구독. `AuthInitializer` 패턴으로 앱 전체에서 한 번만 구독 |
| 런타임/패키지 | Bun | npm 대비 설치 속도 최대 25배 빠름. 로컬 개발 환경 부트스트랩 시간 단축 |
| 지도 | 카카오맵 API | 국내 도로명 주소 정확도. REST API 키는 서버 전용 환경변수로 분리하여 클라이언트 노출 차단 |
| 테스트 | Python Playwright | 4개 역할(기사/소장/관리자/비로그인) 모바일 뷰포트(390x844) 전수 검사. 콘솔 에러, 접근성(WCAG), 가로 오버플로우 자동 감지 |
| 배포 | Vercel | main 브랜치 자동 배포, Edge Network CDN, 환경변수 격리 |

---

## 📊 데이터베이스 설계 (ERD)

```mermaid
erDiagram
    profiles {
        uuid id PK
        text role "driver | manager | admin"
        text name
        text phone
        float rating_avg
        int review_count
        bool is_certified
        int penalty_count
        timestamptz banned_until
        text avatar_url
    }

    jobs {
        uuid id PK
        uuid manager_id FK
        text title
        text status "open | closed | in_progress | completed | settled"
        text[] equipment_codes
        date work_date
        int pay_amount
        text pay_due_type
        text location_address
        text location_detail
    }

    applications {
        uuid id PK
        uuid job_id FK
        uuid driver_id FK
        text status "pending | reviewing | accepted | rejected | cancelled_by_driver | cancelled_by_manager"
        text applied_equipment_code
    }

    chat_rooms {
        uuid id PK
        uuid job_id FK
        uuid manager_id FK
        uuid driver_id FK
        uuid application_id FK
    }

    chat_messages {
        uuid id PK
        uuid room_id FK
        uuid sender_id FK
        text content
        bool is_read
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text type
        text message
        bool is_read
        jsonb metadata
    }

    ledger_expenses {
        uuid id PK
        uuid user_id FK
        text category
        int amount
        date expense_date
        text memo
    }

    reviews {
        uuid id PK
        uuid reviewer_id FK
        uuid reviewee_id FK
        uuid job_id FK
        int rating
        text comment
    }

    certifications {
        uuid id PK
        uuid driver_id FK
        text cert_type "license | safety"
        text status "pending | approved | rejected"
        text image_url
    }

    profiles ||--o{ jobs : "등록(manager)"
    profiles ||--o{ applications : "지원(driver)"
    jobs ||--o{ applications : "접수"
    applications ||--o| chat_rooms : "검토 전환 시 생성"
    chat_rooms ||--o{ chat_messages : "포함"
    profiles ||--o{ chat_messages : "전송"
    profiles ||--o{ notifications : "수신"
    profiles ||--o{ ledger_expenses : "기록"
    profiles ||--o{ reviews : "작성(reviewer)"
    profiles ||--o{ reviews : "수신(reviewee)"
    profiles ||--o{ certifications : "제출(driver)"
```

**설계 의도**

`applications.status`에 `cancelled_by_driver`와 `cancelled_by_manager`를 별도 값으로 두어 취소 주체를 DB 레벨에서 구분한다. 취소가 발생하면 PATCH 요청 한 번으로 상태 변경과 패널티 부여가 트랜잭션처럼 처리된다.

`reviews` 테이블은 `(reviewer_id, reviewee_id, job_id)` 조합에 UNIQUE 제약을 두어 동일 일감에 대한 이중 평가를 DB에서 차단한다. PostgREST가 동일 테이블을 두 개의 FK로 참조할 때 관계를 특정하지 못하는 문제가 있어, 리뷰 데이터는 별도 쿼리 후 JavaScript에서 수동으로 병합한다.

---

## 🌟 핵심 비즈니스 로직

### 1. 노쇼 패널티 및 자동 이용 제한 시스템

배차가 확정된(`accepted`) 이후의 일방적 취소에만 패널티를 부과한다. `pending`이나 `reviewing` 단계의 취소는 정상적인 배차 과정의 일부이므로 제재를 가하지 않는다.

**패널티 누적 및 이용 제한 로직** (`app/api/applications/[id]/cancel/route.ts`)

```typescript
// types/index.ts
export const PENALTY_BAN_THRESHOLDS: Record<number, number> = { 5: 3, 10: 7 }
// 5회 누적 → 3일 이용 제한, 10회 누적 → 7일 이용 제한

// cancel API
const newCount = (currentProfile?.penalty_count ?? 0) + 1
const banDays = PENALTY_BAN_THRESHOLDS[newCount]
const updateData: Record<string, unknown> = { penalty_count: newCount }

if (banDays) {
  updateData.banned_until = new Date(Date.now() + banDays * 86400000).toISOString()
}

await admin.from('profiles').update(updateData).eq('id', cancelUserId)
```

`PENALTY_BAN_THRESHOLDS`는 `types/index.ts`에 단일 상수로 정의되어 서버(cancel API)와 클라이언트(ban UI) 양쪽에서 동일하게 사용한다. 임계값이 바뀌어도 한 곳만 수정하면 된다.

제한 중인 사용자가 지원이나 일감 등록을 시도하면 서버에서 403을 반환하고, 클라이언트는 `banned_until` 날짜를 파싱하여 "N월 N일까지 제한됩니다" 안내를 보여준다. 서버와 클라이언트 양측에서 동시에 검증한다.

---

### 2. 통합 현장 장부 시스템

기사와 소장의 장부 구조는 다르게 설계했다.

기사는 배차가 완료된 일감의 지급 금액이 수입으로 자동 집계되고, 유류비 등 지출은 직접 입력한다. 소장은 배차한 기사별 지급 금액 합산이 지출로 잡히고, 수주 금액에서 이를 빼면 마진이 계산된다.

`ledger_expenses` 테이블 하나에 수입과 지출을 함께 저장한다. `category = '수입'`으로 저장된 항목이 수동 수입이고, 나머지는 지출이다. 집계 로직에서 이를 분기 처리하는 곳이 세 군데인데(`buildMonthData`, `computePanelNet`, `summaryValues`), 한 곳만 고치면 다른 화면의 수치가 달라지는 문제가 생겨서 반드시 세 곳을 동시에 수정해야 한다.

**달력 셀 금액 포맷** (`lib/utils/ledger.ts`)

```typescript
export function formatCellBadge(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount >= 0 ? '+' : '-'
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000)}만`
  return `${sign}${abs.toLocaleString()}`
}
```

달력 셀은 공간이 협소해서 "1,200,000원"을 그대로 표시하면 레이아웃이 무너진다. 셀에는 "120만", 상세 패널에는 전체 금액을 표시하는 방식으로 분리했다.

---

### 3. 우수 기사 평점 자동 인증

리뷰가 등록될 때마다 해당 피평가자의 전체 리뷰를 재집계한다. 조건을 충족하면 `is_certified`가 자동으로 `true`가 된다. 관리자의 수동 승인 없이 작동한다.

**자동 인증 트리거** (`app/api/reviews/route.ts`)

```typescript
// types/index.ts에 상수로 정의
export const CERT_AUTO_MIN_RATING = 4.5
export const CERT_AUTO_MIN_REVIEWS = 5

// 리뷰 등록 성공 후 대상자 평점 재집계
const { data: allRatings } = await supabase
  .from('reviews')
  .select('rating')
  .eq('reviewee_id', reviewee_id)

const count = allRatings?.length ?? 0
const avg = count > 0
  ? Math.round((allRatings!.reduce((sum, r) => sum + r.rating, 0) / count) * 100) / 100
  : 0

const shouldAutoCertify = avg >= CERT_AUTO_MIN_RATING && count >= CERT_AUTO_MIN_REVIEWS

await supabase
  .from('profiles')
  .update({
    rating_avg: avg,
    review_count: count,
    ...(shouldAutoCertify ? { is_certified: true } : {}),
  })
  .eq('id', reviewee_id)
```

평점이 낮아지더라도 한 번 부여된 인증이 자동으로 취소되지는 않는다. 인증 취소는 관리자가 직접 처리하는 방식으로 분리해두었다.

---

### 4. 실시간 알림 레이어

알림은 Supabase Realtime의 `INSERT` 이벤트를 구독하여 새로고침 없이 수신한다. 앱 전체에서 단 한 번만 구독하도록 `AuthInitializer` 컴포넌트에서 `useNotifications` 훅을 초기화하고, 나머지 컴포넌트는 Zustand 스토어에서 카운트만 읽는다.

패널티 뱃지는 Realtime과 별개로, `profiles.penalty_count`를 일감 목록(`JobCard`), 일감 상세(`ManagerBlock`), 지원자 목록(`ApplicantCard`), 마이페이지(`InlineProfileCard`) 네 곳의 쿼리에 포함시켜서 페이지 진입 시점에 보여준다.

---

## ⚡ 성능 최적화

### 일감 목록: SSR + Next.js 16 캐시 레이어 분리

Next.js 16의 `cacheComponents: true` 모드에서 `"use cache"` 디렉티브를 사용해 일감 목록 첫 페이지를 서버에서 캐싱한다.

```typescript
// lib/utils/jobs-cache.ts
export async function getCachedJobsFirstPage() {
  'use cache'
  cacheLife('seconds')  // 30초 TTL
  cacheTag('jobs')

  const supabase = createPublicClient()  // cookies() 없는 공개 클라이언트
  return supabase
    .from('jobs')
    .select('*, profiles(id, name, rating_avg, review_count, is_certified, avatar_url, penalty_count)')
    .eq('status', 'open')
    .gte('work_date', new Date().toISOString().split('T')[0])
    .order('work_date', { ascending: true })
    .limit(10)
}
```

`/jobs` 페이지는 빌드 시 `Static`으로 렌더링된다. 사용자별 지원 버튼과 소장 전용 액션은 `UserJobSection`에서 `'use client'`와 `useAuthStore`로 클라이언트 사이드에서 분리 처리한다. 일감 등록이나 수정이 발생하면 `revalidateTag('jobs', 'max')`로 캐시를 즉시 무효화한다.

### 일감 상세: Partial Prerender (PPR)

`/jobs/[id]` 페이지는 빌드 결과가 `◐ (Partial Prerender)` 상태다. 공개 일감 정보는 `cacheLife('minutes')`로 서버 캐싱되고, 지원 버튼과 배차 현황은 클라이언트에서 마운트 후 렌더링된다.

`await params`를 포함하는 async 서버 컴포넌트가 PPR 빌드에서 Suspense 경계 없이 렌더링되면 빌드가 실패한다. sync 외부 컴포넌트에서 `<Suspense>` 래퍼를 만들고, async 로직은 내부 컴포넌트로 분리하는 방식으로 해결했다.

```tsx
// 외부: sync 컴포넌트 (Suspense 래퍼)
export default function JobDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <JobDetailContent params={params} />
    </Suspense>
  )
}

// 내부: async 컴포넌트
async function JobDetailContent({ params }: Props) {
  const { id } = await params
  const job = await getCachedJobDetail(id)
  return <div>...</div>
}
```

### 장부 지출 추가: 낙관적 업데이트

지출 항목을 추가할 때 서버 응답을 기다리지 않고 UI를 먼저 갱신한다. 실패하면 이전 상태로 자동 복원된다.

```typescript
// hooks/useLedger.ts
useMutation({
  mutationFn: (expense) => fetch('/api/ledger/expenses', { method: 'POST', body: JSON.stringify(expense) }),
  onMutate: async (newExpense) => {
    await queryClient.cancelQueries({ queryKey: ['ledger', year, month] })
    const previous = queryClient.getQueryData(['ledger', year, month])
    queryClient.setQueryData(['ledger', year, month], (old: LedgerData) => ({
      ...old,
      expenses: [...old.expenses, { ...newExpense, id: `temp-${Date.now()}` }],
    }))
    return { previous }
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(['ledger', year, month], context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['ledger', year, month] })
  },
})
```

### 초기 데이터 로딩: HydrationBoundary 패턴

일감 목록 페이지에서 클라이언트가 마운트되기 전에 첫 페이지 데이터를 서버에서 미리 채운다. 이 방식으로 초기 로드 시 로딩 스피너가 나타나지 않고, TanStack Query가 캐시된 데이터를 즉시 사용한다.

```typescript
// app/jobs/page.tsx (Server Component)
const queryClient = new QueryClient()

await queryClient.prefetchInfiniteQuery({
  queryKey: ['jobs', DEFAULT_FILTERS],
  queryFn: ({ pageParam = 0 }) => fetchCachedJobsPage(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length : undefined,
})

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <JobList />
  </HydrationBoundary>
)
```

---

## 🔒 보안 설계

### Supabase RLS (Row Level Security)

역할별 데이터 접근 제어는 애플리케이션 레이어가 아닌 DB 레벨에서 처리한다. 클라이언트가 직접 Supabase를 호출하더라도 RLS 정책이 없으면 데이터에 접근할 수 없다.

주요 정책:

- `jobs` 테이블: `status = 'open'`인 일감은 누구나 읽을 수 있지만, 등록은 `role = 'manager'`인 사용자만 가능하다.
- `applications` 테이블: 기사는 본인이 지원한 행만 읽을 수 있고, 소장은 자신이 올린 일감에 지원한 행만 읽을 수 있다.
- `profiles` 테이블: 본인 행만 UPDATE 가능하다.

패널티 부여나 인증 승인처럼 RLS를 우회해야 하는 서버 전용 작업은 `service_role` 키를 사용하는 `createAdminClient()`를 통해서만 처리한다. 이 클라이언트는 API Route 서버 환경에서만 사용하며 클라이언트 번들에 포함되지 않는다.

```typescript
// lib/supabase/admin.ts
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NEXT_PUBLIC_ 없음 — 서버 전용
  )
}
```

### API Route 인증 및 환경변수 관리

모든 데이터 변경 API Route는 요청 초입에 `supabase.auth.getUser()`로 세션을 검증한다. 세션이 없으면 즉시 401을 반환한다. 역할이 필요한 엔드포인트(일감 등록, 배차 취소, 패널티 부여 등)는 추가로 `profiles.role`을 확인한다.

카카오 REST API 키는 `KAKAO_REST_API_KEY`로 서버 전용 환경변수에 저장하고, 클라이언트가 직접 호출하는 대신 `/api/address/search` API Route를 프록시로 둔다. `NEXT_PUBLIC_` 접두사가 붙은 환경변수는 브라우저 번들에 포함되기 때문이다.

---

## 🔍 기술적 도전 및 트러블슈팅

### 1. Next.js 16 PPR 빌드 실패: `usePathname()` in Global Initializer

**문제**

`cacheComponents: true` 모드에서 빌드하면 `/chats/[id]` 등 동적 라우트에서 "Uncached data was accessed outside of Suspense" 에러가 발생했다. 해당 페이지에 `<Suspense>` 래퍼를 추가해도 에러가 계속 반복됐다.

**원인**

`--debug-prerender` 플래그로 실제 원인 컴포넌트를 추적하니 `NotificationInitializer`였다. 이 컴포넌트가 내부적으로 `usePathname()`을 사용하고 있었는데, Next.js 16 PPR 모드에서 `usePathname()`은 uncached dynamic data로 분류된다. `NotificationInitializer`가 루트 레이아웃의 `Providers` 안에서 `{children}` 바깥에 위치해 있어서, 어떤 페이지의 Suspense 래퍼와도 상관없이 빌드가 실패했다.

**해결**

`usePathname()` 임포트를 제거하고 `window.location.pathname`을 반환하는 순수 헬퍼 함수로 교체했다. 클라이언트 전용 경로 감지에는 Next.js 라우팅 훅이 필요하지 않다.

```typescript
// 변경 전 (PPR 빌드 실패)
import { usePathname } from 'next/navigation'
const pathname = usePathname()
if (pathname === '/notifications') return

// 변경 후 (PPR 호환)
const isOnNotificationsPage = () =>
  typeof window !== 'undefined' && window.location.pathname === '/notifications'
if (isOnNotificationsPage()) return
```

이후 `/jobs`, `/jobs/[id]`, `/chats/[id]` 세 경로 모두 `◐ Partial Prerender` 상태로 빌드 성공을 확인했다.

---

### 2. Supabase Realtime UPDATE: REPLICA IDENTITY DEFAULT payload 누락

**문제**

채팅에서 메시지를 보낸 쪽은 화면에 "1" 표시(읽지 않음)가 남아 있었는데, 상대방이 채팅방에 들어가도 실시간으로 "1"이 사라지지 않았다. `is_read`가 `true`로 바뀌는 UPDATE 이벤트가 수신 측에 반영되지 않고 있었다.

**원인**

Supabase의 기본 설정인 `REPLICA IDENTITY DEFAULT`에서는 UPDATE 이벤트의 `payload.new`에 PK(`id`)와 실제로 변경된 컬럼만 포함된다. `room_id`처럼 변경되지 않은 컬럼은 payload에 없어서 `undefined`가 된다.

기존 코드는 `updated.room_id !== currentRoom.id`로 귀속 여부를 판단하고 있었다. `updated.room_id`가 항상 `undefined`이므로 이 조건이 항상 `true`가 되어 early return이 발생했고, `setMessages`가 호출되지 않았다.

```typescript
// 문제가 있던 코드: room_id가 payload에 없으면 undefined → 항상 early return
if (updated.room_id !== currentRoom.id) return
setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
```

**해결**

`room_id` 체크를 제거하고, 해당 메시지 ID가 현재 state에 존재하는지 여부로 귀속 여부를 판단하는 방식으로 교체했다.

```typescript
// 변경 후: ID 존재 여부로 귀속 판단
setMessages(prev => {
  if (!prev.some(m => m.id === updated.id)) return prev
  return prev.map(m => m.id === updated.id ? { ...m, ...updated } : m)
})
```

`REPLICA IDENTITY FULL`을 설정하면 payload에 모든 컬럼이 포함되지만, 테이블 단위 설정이 필요하고 WAL 크기가 늘어나는 트레이드오프가 있다. ID 기반 존재 확인 방식이 더 가볍고 안전한 대안이었다.

---

### 3. KST 자정 날짜 오프-바이-원 버그

**문제**

일감 목록의 "마감" 필터와 장부 달력의 오늘 날짜 하이라이트가 자정 직후 한두 시간 사이에 하루씩 어긋나는 증상이 있었다. 재현 조건이 시간대에 국한돼서 초반에 원인을 찾기가 쉽지 않았다.

**원인**

`new Date().toISOString().split('T')[0]` 패턴이 문제였다. `toISOString()`은 내부적으로 UTC 변환을 거친 뒤 날짜 문자열을 만든다. KST는 UTC+9이므로 자정 0시 KST는 전날 오후 3시 UTC에 해당한다. 자정 0시부터 오전 8시 59분 사이에 이 코드를 실행하면 어제 날짜가 반환된다.

```typescript
// KST 00:00 기준 실행 결과
new Date().toISOString()           // "2026-06-13T15:00:00.000Z" (전날 UTC)
new Date().toISOString().split('T')[0]  // "2026-06-13" (하루 전)

// 실제 로컬 날짜
new Date().getDate()               // 14  (정확한 KST 날짜)
```

**해결**

클라이언트 컴포넌트 전반에 흩어진 `toISOString().split('T')[0]` 패턴을 `getTodayStr()`으로 일괄 교체했다. `getDate()`는 JavaScript 엔진이 로컬 타임존 기준으로 날짜를 반환하기 때문에 KST 환경에서 정확하다.

```typescript
// lib/utils/date.ts
export function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
```

이 함수를 기점으로 날짜 포맷 유틸을 `lib/utils/date.ts`로 통합했다. 기존에 10개 이상 파일에 흩어져 있던 `toLocaleDateString()` 호출과 오늘 날짜 비교 로직이 단일 파일로 집약됐다.

---

## 🧹 코드 품질 개선

기능 구현 이후 코드베이스 전체를 보안, 접근성, 중복 세 방향으로 검토했다. 발견된 문제 중 기록할 만한 사례를 정리한다.

---

### API 보안: 요청 바디 필드 주입 차단

지출 등록 API에서 `const body = await request.json()` 후 `insert({ ...body, driver_id: user.id })`로 그대로 전달하고 있었다. `driver_id`를 body에 포함해 전송하면 다른 사용자의 ID로 덮어쓸 수 있는 구조였다.

```typescript
// 변경 전: body 전체를 spread하면 임의 필드 주입 가능
const body = await request.json()
supabase.from('ledger_expenses').insert({ ...body, driver_id: user.id })

// 변경 후: 허용된 필드만 destructure
const { category, amount, expense_date, memo } = await request.json()
supabase.from('ledger_expenses').insert({ category, amount, expense_date, memo, driver_id: user.id })
```

RLS 정책이 있더라도 애플리케이션 레이어에서 먼저 걸러내야 한다는 원칙에 따라, 모든 POST/PATCH API Route에서 바디 필드를 명시적으로 destructure하도록 교체했다. 같은 맥락에서 `try/catch` 없이 외부 API를 호출하던 엔드포인트에도 에러 핸들링을 추가했다.

---

### 접근성: WCAG 2.5.5 터치 타겟 기준 적용

모바일 사용자 비중이 높은 서비스 특성상 터치 타겟 크기를 점검했다. WCAG 2.5.5는 대화형 요소의 최소 터치 타겟을 44x44px로 권장한다.

| 컴포넌트 | 변경 전 | 변경 후 |
|----------|---------|---------|
| NavButtons 햄버거 버튼 | 36x36px | 44x44px |
| MonthPicker 연도 이동 버튼 | 32x32px | 40x40px |
| LedgerCalendar 날짜 배지 | 24x24px | 28x28px |

스크린 리더 대응도 함께 처리했다. `JobStatusBadge` 드롭다운에 `aria-expanded`, `aria-haspopup="listbox"`, 옵션 항목에 `role="option"` + `aria-selected`를 추가했다. 햄버거 버튼에는 `aria-expanded`와 `aria-haspopup="menu"`를 달았고, MonthPicker 이전/다음 버튼에는 `aria-label`을 넣었다.

채팅 입력창(`ChatInput`)의 `<textarea>`처럼 시각적 레이블만 있고 `<label>` 연결이 없는 폼 요소에는 `sr-only` 레이블을 추가했다. `AddExpenseModal`은 열릴 때 금액 입력 필드로 포커스가 자동 이동하고, 닫힐 때 트리거 버튼으로 포커스가 복원되도록 `prevFocusRef` 패턴을 적용했다.

---

### 컴포넌트 설계: useJobForm 훅 분리

`JobForm.tsx`는 556줄짜리 파일이었고, 폼 상태 관리, 유효성 검사, API 호출, 라우팅, UI 렌더링이 한 컴포넌트 안에 섞여 있었다.

submit 로직과 폼 상태를 `hooks/useJobForm.ts`로 분리했다. 훅이 `form`, `set`, `toggleEquipment`, `setPayment`, `isValid`, `isSubmitting`, `handleSubmit`을 반환하고, `JobForm.tsx`는 UI 렌더링에만 집중한다. 파일 크기는 556줄에서 375줄로 줄었다.

```typescript
// hooks/useJobForm.ts
export function useJobForm({ mode, jobId, initialValues }: UseJobFormOptions) {
  const [form, setForm] = useState<FormState>(...)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    // 유효성 검사, API 호출, 라우팅 처리
  }

  return { form, set, toggleEquipment, setPayment, isValid, isSubmitting, handleSubmit }
}

// JobForm.tsx
export function JobForm({ mode, jobId, initialValues }: JobFormProps) {
  const { form, set, ..., handleSubmit } = useJobForm({ mode, jobId, initialValues })
  // UI만 담당
}
```

---

### 타입 안전성: 이중 캐스팅 제거

Supabase PostgREST join이 반환하는 타입이 SDK의 추론 타입과 실제 런타임 형태 사이에 차이가 있을 때, `as unknown as TargetType` 형태의 이중 캐스팅으로 타입 오류를 회피하고 있는 곳이 2개 있었다.

`daily/[date]/route.ts`에서는 Supabase가 `equipments`를 배열로 반환하지만 SDK 타입이 이를 정확히 추론하지 못해 이중 캐스팅이 필요했다. 쿼리 결과를 명시적으로 `.map()`으로 변환하고, `buildIncomeEntries`의 파라미터 타입을 `model_code: string`으로 완화한 뒤 함수 내부에서 `EquipmentCode`로 캐스팅하는 방식으로 이중 캐스팅을 제거했다.

`applicants/page.tsx`에서는 수동으로 조립한 객체에 `MappedApplication` 인터페이스를 명시하고, 렌더링 직전 `.filter((app) => app.profiles !== null)`로 null을 걸러낸 뒤 단일 캐스팅으로 교체했다. `as unknown as X`가 숨기던 실제 타입 불일치를 처리하는 과정이었다.

---

## 📁 폴더 구조

```
diggo/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 로그인, 회원가입
│   ├── jobs/                     # 일감 목록, 상세, 등록
│   │   ├── [id]/
│   │   │   ├── page.tsx          # PPR — 공개 일감 정보
│   │   │   └── UserJobSection.tsx # 'use client' — 지원 버튼, 소장 액션
│   │   └── new/
│   ├── manager/                  # 소장 전용 (내 일감, 지원자 목록)
│   ├── mypage/                   # 마이페이지, 장부, 지원 내역
│   ├── chats/                    # 채팅 목록, 채팅방
│   ├── profiles/                 # 공개 프로필
│   ├── notifications/            # 알림
│   └── api/                      # API Routes
│       ├── jobs/
│       ├── applications/
│       │   └── [id]/cancel/      # 패널티 부여 엔드포인트
│       ├── chats/
│       ├── ledger/
│       ├── reviews/              # 평점 재집계 + is_certified 자동화
│       └── auth/
├── components/
│   ├── ui/                       # Avatar, EquipmentBadge, CertBadge, EmptyState
│   └── features/                 # 기능별 컴포넌트
│       ├── jobs/                 # JobCard, JobApplyButton, JobForm
│       ├── manager/              # ApplicantCard
│       ├── ledger/               # LedgerDayPanel, AddExpenseModal
│       ├── chat/                 # ChatRoom, ChatRoomMenu, ChatMessageBubble
│       └── mypage/               # InlineProfileCard, ReviewModal
├── hooks/
│   ├── useJobForm.ts             # 폼 상태 + submit 로직 훅 (JobForm에서 분리)
│   ├── useLedger.ts              # 장부 데이터 + 낙관적 업데이트
│   └── useHorizontalScroll.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient
│   │   ├── server.ts             # createServerClient ('use no-store')
│   │   └── admin.ts              # createAdminClient (service_role)
│   ├── api/
│   │   └── auth.ts               # API Route 공통 인증 헬퍼
│   └── utils/
│       ├── date.ts               # getTodayStr, formatWorkDate 등 날짜 유틸 통합
│       ├── jobs-cache.ts         # "use cache" + cacheLife + cacheTag
│       └── ledger.ts             # formatKRW, buildMonthData, computePanelNet
├── store/
│   ├── auth.ts                   # useAuthStore (Zustand)
│   └── notification.ts           # useNotificationStore
└── types/
    └── index.ts                  # ApplicationStatus, PENALTY_BAN_THRESHOLDS,
                                  # CERT_AUTO_MIN_RATING, CERT_AUTO_MIN_REVIEWS
```

---

## 🚀 실행 방법

**필수 환경변수** (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=
KAKAO_REST_API_KEY=
```

**개발 서버 실행**

```bash
bun install
bun dev
```

**타입 체크**

```bash
bun run type-check
```

**프로덕션 빌드**

```bash
bun run build
```

**테스트 (Playwright)**

```bash
pip install playwright
playwright install chromium
python test-results/e2e_full.py
```

---

## 개선 예정

| 기능 | 설명 |
|------|------|
| 장비 여러 대 운용 | 기사가 보유한 여러 장비에 담당자를 지정하고, 장비별 장부를 분리 관리 |
| 차고지 기준 거리 표시 | 일감 목록에서 내 차고지로부터의 거리를 카카오맵 API로 계산하여 표시 |
| 장부 Excel/PDF 내보내기 | 월별 장부를 종합소득세 신고용 양식으로 내보내기 |
| 체불 소장 블랙리스트 | 정산 지연 이력이 누적된 소장에게 경고 표시 |
| 관리자 v2 | 유저 계정 관리, 부적절 게시물 강제 마감, 통계 대시보드 |
