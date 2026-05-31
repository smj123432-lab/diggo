# Diggo — 굴착기 배차 플랫폼

---

## 1. 프로젝트 개요

### 개발 배경

저는 굴착기 기사로 현장에서 일한 경험이 있습니다.
현장에서 기사와 소장 사이에는 구조적인 신뢰 문제가 있습니다.

**기사 입장**

- 경력과 실력이 있어도 나이가 어리다는 이유로 일감을 잡지 못하는 경우가 빈번합니다
- 작업을 완료했음에도 대금 지급이 미뤄지거나 지급되지 않는 경우도 적지 않습니다
- 장부를 수기로 기입해 언제 일했는지 체크하는 것이 불편합니다

**소장 입장**

- 경력을 속인 기사로 인한 현장 사고 피해가 실제로 발생합니다

이 문제를 해결하기 위해, 상호 평가와 인증 뱃지를 통해 서로를 검증할 수 있는 배차 플랫폼을 개발했습니다.

### 차별점

기존 중장비 플랫폼에는 없는 **전자장부 기능**을 제공합니다.
현장에서 사장님들이 수기로 장부를 작성하는 모습을 직접 보며 불편함을 느꼈고, 이를 해결하고자 설계했습니다.
작업 완료 시 해당 날짜에 지급 예정 금액이 자동으로 기록되며, 유류비 등 지출도 직접 입력해 월별 순수익을 한눈에 확인할 수 있습니다.

### 타겟 사용자

- 주 연령층: 30~50대 굴착기 기사 및 소장
- 핵심 가치: 직관적인 UI, 신뢰 기반 거래
- 장비: 굴착기 전용 (도메인 전문성 기반)

### 시장 포지셔닝

- 기존 플랫폼: 배차 중개까지만 제공, 정산/기록은 수기
- Diggo: 배차 + 전자장부 + 신뢰 검증 통합 제공
- 초기 타겟: 인맥이 없는 신규 기사 + 검증된 기사를 원하는 신규 소장

---

## 2. 사용자 역할

| 역할           | 설명                              |
| -------------- | --------------------------------- |
| 기사 (driver)  | 일감 조회 및 지원, 장부 관리      |
| 소장 (manager) | 일감 등록, 지원자 관리, 평가      |
| 관리자 (admin) | 자격증 인증 승인, 신고 처리, 통계 |

> 기사는 본인 명의 장비를 여러 대 등록하고 각 장비에 담당 기사를 지정할 수 있습니다.
> 별도 역할 추가 없이 기사 역할 안에서 해결합니다.

### 장비 여러 대 운용 구조

```
기사 (홍길동)
├── 장비 1: 035 → 담당: 본인
├── 장비 2: 008 (미니) → 담당: 김철수 (하청 기사)
└── 장비 3: 3w (휠) → 담당: 박영수 (하청 기사)
```

- 일감 신청 시 어떤 장비로 갈지 선택 → 담당 기사에게 알림
- 장부: 내 장부 (본인 작업) / 전체 장비 뷰 (합산) 분리

---

## 3. 장비 분류 (굴착기 전용)

| 표기       | 설명        | 주요 용도             |
| ---------- | ----------- | --------------------- |
| 008 (미니) | 미니 굴착기 | 철거, 실내, 협소 공간 |
| 017        | 소형 굴착기 | 소규모 토목           |
| 035        | 소형 굴착기 | 일반 토목             |
| 02         | 2t급        |                       |
| 3w (휠)    | 3톤 휠타입  | 도로, 포장            |
| 6w (휠)    | 6톤 휠타입  | 도로, 포장            |
| 8w (휠)    | 8톤 휠타입  |                       |
| 10t        | 10톤 크롤러 | 대형 토목             |

> 굴착기만 취급하는 이유: 개발자 본인이 직접 굴착기 기사로 일한 경험이 있어 도메인을 정확히 이해하고 있습니다.
> 확장 가능한 구조로 설계해 추후 다른 장비 추가 가능합니다.

---

## 4. 핵심 기능

### 배차 플로우

```
소장이 일감 등록
→ 기사가 일감 조회 후 지원 신청
→ 소장이 "검토중" 전환 → 채팅방 오픈
→ 기사 ↔ 소장 협의 (어태치먼트 추가 비용 등)
→ 소장 수락 → "배차 확정" 상태 전환
→ 작업 완료
→ 상호 평가 (기사 ↔ 소장)
→ 평점 및 뱃지 반영 + 장부 자동 기록 (지급 대기 상태)
→ 기사 입금 확인 후 지급 완료 전환
```

**노쇼 패널티 로직**

- 배차 확정 후 기사가 일방적으로 취소 시 → 평점 감점 + 패널티 뱃지
- 배차 확정 후 소장이 일방적으로 취소 시 → 평점 감점 + 패널티 뱃지
- 패널티 뱃지는 프로필에 노출되어 신뢰도 하락
- applications 상태값에 `cancelled_by_driver`, `cancelled_by_manager` 추가

### 일감 등록 필드

**공통 필드**

| 필드                                              | 필수 여부 |
| ------------------------------------------------- | --------- |
| 일감 유형 (일반 토목 / 철거)                      | 필수      |
| 일 내용                                           | 필수      |
| 필요 장비 (8종 중 선택)                           | 필수      |
| 작업 일자                                         | 필수      |
| 예상 작업 시간                                    | 선택      |
| 작업 주소 (카카오맵 검색)                         | 필수      |
| 지급 금액                                         | 필수      |
| 지급 예정일 (완료 당일 / D+3 / D+7 / D+14 / D+30) | 필수      |

**철거 시 추가 필드**

| 필드                                      | 필수 여부 |
| ----------------------------------------- | --------- |
| 필요 어태치먼트 (뿌레카, 크라샤, 집게 등) | 선택      |
| 주의사항 (유리섬유 주의 등)               | 선택      |

> 어태치먼트 추가 비용은 소장이 일감 내용에 자유 기재하거나 채팅으로 협의합니다.
> 플랫폼에서 단가를 고정하지 않습니다.

### 평가 & 신뢰 시스템

- 일감 완료 후 기사 ↔ 소장 상호 평가
- 평점 누적 및 프로필 반영
- 좋은 평가 다수 시 인증 뱃지 부여
- 나쁜 평가도 이력에 남아 상호 필터링 가능
- 지급일 준수율 소장 프로필에 표시
- 자격증 업로드 → 관리자 인증 승인 → 인증 뱃지

### 전자장부

- 달력 뷰: 일한 날 장비명 + 지급 예정 금액 자동 표시
- 날짜 탭 시 아래 리스트에 일감 상세 표시 (일 내용, 장비, 소장, 어태치먼트)
- 월 요약: 총 수입 / 총 지출 / 순수익
- 지출 직접 입력 (유류비, 장비 소모품 등 카테고리 + 메모 + 금액)
- 일별 실수령 자동 계산 (수입 - 지출)
- 장비 여러 대 운용 시 내 장부 / 전체 장비 합산 뷰 탭 전환

**지급 상태 분리 (중요)**

- 작업 완료 시 → 자동으로 [지급 대기] 상태로 장부에 기록
- 기사가 입금 확인 후 버튼 누르면 → [지급 완료] 상태로 전환
- 순수익은 [지급 완료] 기준으로만 계산
- 이유: 현장에서는 작업 완료 후 보름~한 달 뒤 입금이 흔함. 완료 즉시 수입으로 잡으면 실제 통장 잔고와 장부가 불일치하는 문제 발생

### 채팅

- 소장이 지원자를 "검토중" 으로 전환 시 1:1 채팅방 오픈
- 일감 + 지원 건 기준으로 채팅방 생성 (지원자별 분리)
- 읽음 / 안읽음 표시
- Supabase Realtime으로 구현

### 알림

- 지원자 발생 시 소장에게 알림
- 수락 / 거절 시 기사에게 알림
- 채팅 메시지 수신 시 알림
- Supabase Realtime 구독

---

## 5. 페이지 목록 (총 27페이지)

### 공통 (3페이지)

| 페이지    | 경로      |
| --------- | --------- |
| 랜딩 / 홈 | `/`       |
| 로그인    | `/login`  |
| 회원가입  | `/signup` |

### 기사 (11페이지)

| 페이지       | 경로                     |
| ------------ | ------------------------ |
| 일감 목록    | `/jobs`                  |
| 일감 상세    | `/jobs/[id]`             |
| 마이페이지   | `/mypage`                |
| 프로필 수정  | `/mypage/edit`           |
| 자격증 관리  | `/mypage/certifications` |
| 장부         | `/mypage/ledger`         |
| 내 지원 목록 | `/mypage/applications`   |
| 받은 평가    | `/mypage/reviews`        |
| 채팅 목록    | `/chats`                 |
| 채팅방       | `/chats/[id]`            |
| 알림         | `/notifications`         |

### 소장 (8페이지)

| 페이지       | 경로                                            |
| ------------ | ----------------------------------------------- |
| 일감 등록    | `/jobs/new`                                     |
| 내 일감 목록 | `/manager/jobs`                                 |
| 지원자 목록  | `/manager/jobs/[id]/applicants`                 |
| 지원자 상세  | `/manager/jobs/[id]/applicants/[applicationId]` |
| 마이페이지   | `/mypage`                                       |
| 채팅 목록    | `/chats`                                        |
| 채팅방       | `/chats/[id]`                                   |
| 알림         | `/notifications`                                |

### 관리자 (5페이지)

| 페이지           | 경로                    |
| ---------------- | ----------------------- |
| 대시보드         | `/admin`                |
| 회원 목록        | `/admin/users`          |
| 자격증 인증 목록 | `/admin/certifications` |
| 신고 목록        | `/admin/reports`        |
| 일감 관리        | `/admin/jobs`           |

### MVP 범위 (15페이지)

| 페이지 | 경로 | 상태 |
| ------ | ---- | ---- |
| 홈/랜딩 | `/` | ✅ |
| 로그인 | `/login` | ✅ |
| 회원가입 | `/signup` | ✅ |
| 일감 목록 | `/jobs` | ✅ |
| 일감 등록 | `/jobs/new` | ✅ |
| 일감 상세 | `/jobs/[id]` | ✅ |
| 내 일감 목록 (소장) | `/manager/jobs` | ⬜ |
| 지원자 목록 (소장) | `/manager/jobs/[id]/applicants` | ⬜ |
| 지원자 상세 (소장) | `/manager/jobs/[id]/applicants/[id]` | ⬜ |
| 마이페이지 | `/mypage` | ⬜ |
| 프로필 수정 | `/mypage/edit` | ⬜ |
| 장부 | `/mypage/ledger` | ✅ |
| 내 지원 목록 (기사) | `/mypage/applications` | ⬜ |
| 받은 평가 (기사) | `/mypage/reviews` | ⬜ |
| 관리자 대시보드 | `/admin` | ⬜ |

**MVP 이후 (v2)**

- 채팅
- 자격증 인증 플로우
- 알림
- 장비 여러 대 운용
- 관리자 세부 페이지

---

## 6. 기술 스택

| 분류       | 선택                    | 이유                                                      |
| ---------- | ----------------------- | --------------------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router) | "use cache" + cacheComponents로 정적 캐싱, 하이브리드 렌더링 |
| 언어       | TypeScript              | 타입 안전성                                               |
| 스타일     | Tailwind CSS            | 빠른 개발                                                 |
| 상태관리   | Zustand                 | 유저 세션, role 관리                                      |
| 서버상태   | TanStack Query          | 무한스크롤, 캐싱, Optimistic Update                       |
| DB / Auth  | Supabase                | RLS 역할별 접근제어, 인증 내장, Realtime                  |
| 지도       | 카카오맵 API            | 주소 검색 (Kakao 로컬 API) + 지도 렌더링 (Kakao Maps SDK) |
| 실시간     | Supabase Realtime       | 채팅, 알림                                                |
| 패키지     | Bun                     | 빠른 속도                                                 |
| 배포       | Vercel                  |                                                           |

---

## 7. DB 설계

### 테이블 목록

| 테이블          | 주요 컬럼                                                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| profiles        | id, name, role(driver/manager/admin), phone, experience_years, garage_address, latitude, longitude, rating_avg, is_certified, created_at                                                                |
| equipments      | id, owner_id(FK), assigned_driver_id(FK), type, model_code, license_number                                                                                                                              |
| jobs            | id, manager_id(FK), title, job_type(토목/철거), equipment_code, description, attachments, caution, location, latitude, longitude, pay_amount, work_date, pay_due_type, pay_due_date, status, created_at |
| applications    | id, job_id(FK), driver_id(FK), equipment_id(FK), status(pending/reviewing/accepted/rejected), applied_at                                                                                                |
| ledger_expenses | id, driver_id(FK), job_id(FK), expense_date, category, memo, amount, created_at                                                                                                                         |
| reviews         | id, job_id(FK), reviewer_id(FK), reviewee_id(FK), rating, comment, created_at                                                                                                                           |
| certifications  | id, driver_id(FK), cert_type, image_url, status(pending/approved/rejected), verified_at                                                                                                                 |
| chats           | id, job_id(FK), application_id(FK), created_at                                                                                                                                                          |
| messages        | id, chat_id(FK), sender_id(FK), content, is_read, created_at                                                                                                                                            |
| notifications   | id, user_id(FK), type, message, is_read, created_at                                                                                                                                                     |

### jobs 상태값

```
open (모집중)
→ closed (모집 마감)          ← 소장이 드롭다운으로 수동 전환, 또는 work_date 경과 시 자동 표시
→ in_progress (작업중)        ← 소장이 기사 지원 수락 시 전환 (구현 예정)
→ completed (작업완료·지급대기) ← 소장이 "현장 작업 완료 처리" 버튼으로 전환
→ settled (정산완료)           ← 소장이 "대금 지급 완료 확인" 버튼으로 전환
```

> `work_date` 경과 시 DB status는 유지되고, 프론트엔드 `effectiveStatus`로만 `closed`로 표시됨.
> 공용 목록(`/jobs`)은 `status = 'open' AND work_date >= today` 조건으로 필터링. 개인 대시보드는 전체 상태 노출.

### applications 상태값

```
pending (지원)
→ reviewing (검토중, 채팅 오픈)
→ accepted (수락) → confirmed (배차 확정)
→ completed (완료)
or rejected (거절)
or cancelled_by_driver (기사 취소, 패널티)
or cancelled_by_manager (소장 취소, 패널티)
```

---

## 8. RLS 정책

| 테이블          | 기사               | 소장                       | 관리자         | 비로그인 |
| --------------- | ------------------ | -------------------------- | -------------- | -------- |
| profiles        | 본인만 R/U         | 본인만 R/U                 | 전체           | 불가     |
| jobs            | 전체 R             | 본인 등록건 CRUD           | 전체           | 전체 R   |
| applications    | 본인 지원건 R      | 내 일감 지원자 R, status U | 전체           | 불가     |
| reviews         | 전체 R, 완료건만 I | 전체 R, 완료건만 I         | 전체           | 전체 R   |
| certifications  | 본인 R/I           | 인증된 것만 R              | 전체, status U | 불가     |
| ledger_expenses | 본인 CRUD          | 불가                       | 전체           | 불가     |
| chats           | 본인 채팅방 R      | 본인 채팅방 R              | 전체           | 불가     |
| messages        | 본인 채팅방 R/I    | 본인 채팅방 R/I            | 전체           | 불가     |
| notifications   | 본인 R/U           | 본인 R/U                   | 전체           | 불가     |

### RLS SQL 예시

```sql
-- 기사: 본인이 지원한 것만 SELECT
create policy "driver can view own applications"
on applications for select
using (auth.uid() = driver_id);

-- 소장: 내 일감에 달린 지원만 SELECT
create policy "manager can view applications on own jobs"
on applications for select
using (
  exists (
    select 1 from jobs
    where jobs.id = applications.job_id
    and jobs.manager_id = auth.uid()
  )
);

-- 채팅: 검토중 전환 시 채팅방 생성 허용
create policy "manager can create chat when reviewing"
on chats for insert
using (
  exists (
    select 1 from applications
    where applications.id = chats.application_id
    and applications.status = 'reviewing'
  )
);
```

---

## 9. API 설계

### 기사

```
GET  /api/jobs                    일감 목록 (필터, 페이지네이션)
                                  ?page=1&limit=12
                                  &equipment_code=035&equipment_code=008   (다중 선택)
                                  &job_type=civil&job_type=demolition       (다중 선택)
                                  &keyword=성수동                           (위치 텍스트 검색)
                                  &sortBy=latest|deadline                   (정렬: 기본 latest)
GET  /api/jobs/[id]               일감 상세
POST /api/applications            지원 신청
GET  /api/applications            내 지원 목록
GET  /api/ledger/monthly          월별 수입 요약
GET  /api/ledger/daily/[date]     일별 상세
POST /api/ledger/expenses         지출 추가
DELETE /api/ledger/expenses/[id]  지출 삭제
```

### 소장

```
POST   /api/jobs                           일감 등록
PATCH  /api/jobs/[id]                      일감 수정 / 상태 변경
GET    /api/jobs/mine                      내 등록 일감
PATCH  /api/applications/[id]/status       수락 / 거절 / 검토중
```

### 공통

```
GET   /api/profile                프로필 조회
PATCH /api/profile                프로필 수정
POST  /api/certifications         자격증 업로드
GET   /api/chats/[applicationId]  채팅방 조회 or 생성
GET   /api/messages/[chatId]      메시지 목록
POST  /api/messages               메시지 전송
GET   /api/notifications          알림 목록
PATCH /api/notifications/read     읽음 처리
POST  /api/reviews                평가 작성
```

### 관리자

```
GET   /api/admin/certifications/pending   인증 대기 목록
PATCH /api/admin/certifications/[id]      승인 / 거절
GET   /api/admin/reports                  신고 목록
GET   /api/admin/stats                    통계
PATCH /api/admin/jobs/[id]               일감 강제 처리
```

---

## 10. 캐싱 전략

### Next.js 서버 캐싱 (Next.js 16 cacheComponents)

| 페이지                   | 전략                     | 빌드 결과           |
| ------------------------ | ------------------------ | ------------------- |
| 일감 목록 `/jobs`        | "use cache" + cacheLife  | ○ Static            |
| 일감 상세 `/jobs/[id]`   | "use cache" + cacheLife  | ◐ Partial Prerender |
| 마이페이지 / 장부 등     | "use no-store" (자동)    | ◐ Partial Prerender |
| API Routes               | 동적                     | ƒ Dynamic           |

```ts
// lib/utils/jobs-cache.ts — 공개 데이터 캐싱 (cookies() 없는 createPublicClient 사용)
export async function getCachedJobsFirstPage() {
  'use cache'
  cacheLife('seconds')  // ~30초
  cacheTag('jobs')
  // Supabase 쿼리 ...
}

// 일감 등록/수정/삭제 후 즉시 캐시 무효화
revalidatePath('/jobs')
revalidateTag('jobs', 'max')  // Next.js 16: 두 번째 인자 필수
```

- `createPublicClient()`: cookies() 없는 Supabase 클라이언트 — "use cache" 함수 전용
- `createClient()`: cookies() + "use no-store" — 인증 필요 페이지 전용
- 사용자별 데이터(`UserJobSection`): 'use client' + useAuthStore로 클라이언트 처리

### TanStack Query 클라이언트 캐싱

| 데이터    | staleTime | 비고              |
| --------- | --------- | ----------------- |
| 일감 목록 | 30초      | 무한스크롤        |
| 일감 상세 | 1분       |                   |
| 프로필    | 10분      |                   |
| 자격증    | 30분      |                   |
| 장부 월별 | 5분       | Optimistic Update |
| 알림      | 0         | 항상 fresh        |

### Optimistic Update (장부 지출 추가)

```ts
onMutate: async (newExpense) => {
  await queryClient.cancelQueries(['ledger', 'daily', date])
  const prev = queryClient.getQueryData(['ledger', 'daily', date])
  queryClient.setQueryData(['ledger', 'daily', date], (old) => ({
    ...old,
    expenses: [...old.expenses, newExpense]
  }))
  return { prev }
},
onError: (_, __, context) => {
  queryClient.setQueryData(['ledger', 'daily', date], context.prev)
}
```

### Supabase Realtime

```ts
// 채팅 구독
const channel = supabase
  .channel(`chat:${chatId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `chat_id=eq.${chatId}`,
    },
    (payload) => {
      setMessages((prev) => [...prev, payload.new]);
    },
  )
  .subscribe();
```

---

## 11. 렌더링 전략

| 페이지      | 방식                  | 이유                    |
| ----------- | --------------------- | ----------------------- |
| 일감 목록   | SSR + revalidate 30초 | SEO, 최신 일감          |
| 일감 상세   | ISR 1분               | SEO, 공유 링크 미리보기 |
| 장부        | CSR (no-store)        | 개인 데이터             |
| 채팅 / 알림 | CSR + Realtime        | 실시간                  |
| 마이페이지  | CSR                   | 개인 데이터             |
| 관리자      | SSR (force-dynamic)   | 항상 최신               |

### Hydration 패턴

```ts
// 서버에서 prefetch → 클라이언트 hydrate
const queryClient = new QueryClient()
await queryClient.prefetchInfiniteQuery({
  queryKey: ['jobs', filters],
  queryFn: fetchJobs,
})

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <JobList />
  </HydrationBoundary>
)
```

---

## 12. 개발 우선순위

### MVP (약 2주)

| 순서 | 작업                                  | 상태 |
| ---- | ------------------------------------- | ---- |
| 1    | 프로젝트 세팅 + Supabase 테이블 + RLS | ✅ 완료 |
| 2    | 인증 (로그인 / 회원가입 / 역할 선택)  | ✅ 완료 |
| 3    | 홈/랜딩 페이지                        | ✅ 완료 |
| 4    | 일감 목록 + 필터 + 무한스크롤         | ✅ 완료 |
| 5    | 일감 등록 폼 + 카카오맵               | ✅ 완료 |
| 6    | 일감 상세 + 지원 신청                 | ✅ 완료 |
| 7    | 지원자 관리 (소장)                    | ✅ 완료 |
| 8    | 마이페이지 + 프로필 수정              | ✅ 완료 |
| 9    | 내 지원 목록 (기사)                   | ✅ 완료 |
| 10   | 관리자 대시보드 (인증 승인)           | ✅ 완료 |
| 11   | Vercel 배포 + 버그 수정               | ✅ 완료 |
| 12   | 받은 평가 UI                          | ⬜ 미완료 |
| 13   | 장부 UI (달력 + 지출 입력)            | ✅ 완료 |
| 14   | 채팅 (Supabase Realtime)              | ⬜ 미완료 |
| 15   | 알림                                  | ⬜ 미완료 |

### 완료 상세 내역 (2026-05-28 기준)

**일감 목록 페이지 (`/jobs`)**
- 무한스크롤 (첫 진입 12개, 이후 8개씩)
- 장비 / 유형 필터 (사이드바 + 모바일 칩)
- 정렬: 최신순 / 마감 임박순 / 내 선호순
- 모집중 항상 상단 고정 (open-first)
- 선호 일감 ★ 뱃지 + 툴팁
- 키워드 검색 (지역명)
- 브랜드 커스텀 컬러 (brand-blue, brand-purple)
- **모바일 반응형**: 햄버거 메뉴, 칩 필터 스크롤 힌트, FAB, 검색창 아이콘 내장

**일감 등록 페이지 (`/jobs/new`) — 소장 전용**
- 싱글 카드 레이아웃, 세그먼트 버튼 UI
- 카카오 로컬 API 주소 검색 (서버 프록시)
- 일감 유형별 동적 추가 정보 섹션
- 작업 기간 필드 (반나절 ~ 한달 이상)
- API 보안: mass assignment 방지, 필수값 검증

**API 보안 강화**
- POST /api/jobs, /api/applications: 허용 필드 명시 추출
- PATCH /api/profile: 블랙리스트 → 화이트리스트 방식
- POST /api/reviews: rating 범위(1~5) 검증
- GET /api/address/search: 비로그인 차단

**일감 상세 페이지 (`/jobs/[id]`) — 2026-05-26**
- 5단계 상태 시스템: open → closed → in_progress → completed → settled
- 소장 전용 JobStatusBadge (드롭다운/잠금 배지), JobOwnerActions (상태별 동적 버튼)
- 삭제 안전 모달: "삭제" 입력 안전장치, createPortal, Esc 닫기, 포커스 복원
- 공용 목록 필터링 분리: status=open AND work_date>=today

**마이페이지 + 인증 시스템 (`/mypage`) — 2026-05-27**
- 인라인 프로필 카드 (이름/전화/한줄소개 수정), 기사 정보 카드 (경력/장비/인증 상태)
- 면허증·안전교육 이수증 업로드 → Supabase Storage
- 재업로드 시 기존 서류 삭제 + is_certified 초기화 (우회 방지)
- 마이페이지 상태 3단계: 미등록 → 검토중 → 이수완료 (두 서류 모두 approved 시)

**관리자 인증 승인 시스템 (`/admin/certifications`) — 2026-05-27**
- 기사별 서류 카드 목록 + 모달 검토 UI
- 면허증 + 안전교육 이수증 모두 승인 시 is_certified = true
- 마이페이지 관리자 바로가기 + 대기 건수 뱃지

**미인증 기사 지원 차단 — 2026-05-27**
- POST /api/applications: is_certified 검사, 미인증 시 403 반환
- JobApplyButton: 미인증 기사에게 경고 UI + 마이페이지 링크

**소장 지원자 관리 (`/manager/jobs`, `/manager/jobs/[id]/applicants`)**
- 소장 내 일감 목록 (상태 필터: 전체/모집중/진행중/완료)
- 지원자 목록 (기사 프로필 카드 + 상태 뱃지)
- 지원자 상세 (기사 정보 확인 + 수락/거절/검토중 액션)
- PATCH /api/applications/[id]/status 로 상태 변경

**기사 내 지원 목록 (`/mypage/applications`)**
- 지원한 일감 목록 (상태별 표시: 검토중/수락/거절)
- 일감 상세 링크 포함

**API 구현 현황 (완료)**
- /api/reviews — 평가 작성 (POST)
- /api/ledger/expenses — 지출 CRUD
- /api/ledger/monthly — 월별 수입/지출 집계 (GET)
- /api/notifications — 알림 목록/읽음 처리
- /api/equipments — 장비 등록 (PUT)

**Vercel 배포 — 2026-05-28**
- 배포 URL: https://diggo-zr4b.vercel.app
- 환경변수 5개 등록 (Supabase, Kakao)
- 카카오맵 JavaScript SDK 도메인 등록 완료

### v2 (MVP 이후)

- 채팅 (Supabase Realtime)
- 알림
- 장비 여러 대 운용 (담당 기사 지정)
- 차고지 기준 거리 계산 (카카오맵 API — "내 차고지로부터 15km" 표시)
- 장부 Excel/PDF 내보내기 (세금 신고용, 종합소득세 신고 시 활용)
- 체불 소장 블랙리스트 (상습 체불 소장 경고 표시)
- 안심 결제 에스크로 (대금 체불 방지 — 장기 로드맵)

#### 관리자 v2

| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 유저 관리 | 전체 기사/소장 목록, 계정 정지/복구, 역할 변경 | 높음 |
| 인증 취소 | 승인된 기사의 is_certified 강제 철회 (허위 서류 대응) | 높음 |
| 일감 모니터링 | 전체 일감 목록 조회, 부적절 게시물 강제 삭제/마감 | 높음 |
| 통계 대시보드 | 가입자 수/역할별, 일감 등록 추이, 매칭률, 인증률 | 중간 |
| 리뷰 관리 | 부적절한 평가 삭제, 어뷰징 감지 | 중간 |
| 공지사항 관리 | 전체 or 역할별(기사/소장) 공지 발송 | 낮음 |
| 신고 처리 | 기사/소장 신고 접수, 처리 내역 관리 | 낮음 |

---

## 13. README 구성안

```markdown
# Diggo — 굴착기 배차 플랫폼

## 프로젝트 소개

- 한 줄 설명
- 개발 배경 (포크레인 기사 경험 → 실제 페인포인트)
- 배포 링크 / 시연 영상 (gif)

## 핵심 기능

- 스크린샷과 함께
- 기능 나열 말고 "왜 이 기능이 필요한지" 한 줄씩

## 기술 스택

- 스택 + 선택 이유

## 아키텍처

- ERD
- 캐싱 전략 (Next.js + TanStack Query + Supabase Realtime)
- 렌더링 전략 (SSR / ISR / CSR 하이브리드)

## 트러블슈팅

- 개발 중 막혔던 것들 + 어떻게 해결했는지
- 면접관이 제일 많이 보는 부분

## 개선 예정

- v2 기능 목록
```

---

## 14. Claude Code 시작 프롬프트

Claude Code 세션 시작 시 아래 내용을 입력하세요.

```
이 PLAN.md를 읽고 Diggo 프로젝트를 세팅해줘.

기술 스택:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase (DB, Auth, Realtime, Storage)
- Zustand
- TanStack Query v5
- Bun
- Vercel 배포

시작 순서:
1. Next.js 프로젝트 생성 (with Bun)
2. 필요한 패키지 설치
3. Supabase 클라이언트 설정
4. Zustand store 설정 (유저 세션, role)
5. 폴더 구조 잡기
6. Supabase 테이블 SQL 작성
```
