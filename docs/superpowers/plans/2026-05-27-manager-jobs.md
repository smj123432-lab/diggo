# Manager Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 소장 전용 내 일감 목록·지원자 관리 페이지 구현 및 로고/파비콘 적용

**Architecture:** 기존 상단 nav에 소장 조건부 링크 추가, `/manager/jobs` 하위 3개 페이지 구현, 지원자 수락 시 job status → in_progress 자동 전환. 서버 컴포넌트 기본, 클라이언트 액션은 별도 컴포넌트로 분리.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, Zustand (useAuthStore), TanStack Query

---

## File Map

| 작업 | 파일 |
|------|------|
| Create | `public/logo.png` (이미지 복사) |
| Create | `app/icon.png` (파비콘용) |
| Modify | `app/layout.tsx` (metadata icons) |
| Modify | `components/features/home/NavButtons.tsx` (소장 내 일감 링크 추가) |
| Create | `app/api/jobs/[id]/applications/route.ts` |
| Modify | `app/api/jobs/mine/route.ts` (applicant_count 포함) |
| Modify | `app/api/applications/[id]/status/route.ts` (수락 시 job in_progress 전환) |
| Modify | `app/manager/jobs/page.tsx` |
| Create | `components/features/manager/ManagerJobCard.tsx` |
| Create | `components/features/manager/ManagerJobStatusFilter.tsx` |
| Modify | `app/manager/jobs/[id]/applicants/page.tsx` |
| Create | `components/features/manager/ApplicantCard.tsx` |
| Modify | `app/manager/jobs/[id]/applicants/[applicationId]/page.tsx` |
| Create | `components/features/manager/ApplicantActions.tsx` |

---

## Task 1: 로고 & 파비콘 적용

**Files:**
- Create: `public/logo.png`
- Create: `app/icon.png`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 로고 파일 복사**

```bash
cp "/Users/saminjae/Downloads/제목 없는 디자인 (1) (1).png" /Users/saminjae/diggo/public/logo.png
cp "/Users/saminjae/Downloads/제목 없는 디자인 (1) (1).png" /Users/saminjae/diggo/app/icon.png
```

- [ ] **Step 2: layout.tsx metadata 업데이트**

`app/layout.tsx` 의 `metadata` 를 아래로 교체:

```typescript
export const metadata: Metadata = {
  title: 'Diggo — 굴착기 배차 플랫폼',
  description: '굴착기 기사와 소장을 연결하는 배차 플랫폼. 전자장부로 수입을 관리하세요.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}
```

- [ ] **Step 3: 개발 서버 켜서 탭 파비콘 확인**

```bash
bun dev
```

브라우저 탭에 굴착기 아이콘이 표시되면 완료.

- [ ] **Step 4: 커밋**

```bash
git add public/logo.png app/icon.png app/layout.tsx
git commit -m "feat: 로고 및 파비콘 적용"
```

---

## Task 2: 지원자 목록 API 추가 (`GET /api/jobs/[id]/applications`)

**Files:**
- Create: `app/api/jobs/[id]/applications/route.ts`

- [ ] **Step 1: 파일 생성**

`app/api/jobs/[id]/applications/route.ts` 전체 코드:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/jobs/[id]/applications — 특정 일감의 지원자 목록 (소장 전용)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 본인 일감인지 확인
    const { data: job } = await supabase
      .from('jobs')
      .select('manager_id')
      .eq('id', params.id)
      .single()

    if (!job) {
      return NextResponse.json({ error: '일감을 찾을 수 없습니다.' }, { status: 404 })
    }
    if (job.manager_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, equipment_id,
        profiles(id, name, rating_avg, is_certified, experience_years),
        equipments(id, model_code, license_number)
      `)
      .eq('job_id', params.id)
      .order('applied_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/jobs/[id]/applications]', error)
    return NextResponse.json({ error: '지원자 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

에러 없으면 완료.

- [ ] **Step 3: 커밋**

```bash
git add app/api/jobs/[id]/applications/route.ts
git commit -m "feat: 일감 지원자 목록 API 추가"
```

---

## Task 3: 내 일감 목록 API에 지원자 수 추가

**Files:**
- Modify: `app/api/jobs/mine/route.ts`

- [ ] **Step 1: mine route 수정**

`GET /api/jobs/mine` 에서 지원자 수를 함께 반환하도록 쿼리 수정. 파일 전체 교체:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/jobs/mine — 소장의 내 등록 일감 목록 (지원자 수 포함)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*, applications(id, status)')
      .eq('manager_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // 지원자 수 집계
    const jobs = (data ?? []).map((job) => {
      const applications = (job.applications ?? []) as { id: string; status: string }[]
      return {
        ...job,
        applicant_count: applications.length,
        pending_count: applications.filter((a) => a.status === 'pending').length,
        applications: undefined,
      }
    })

    return NextResponse.json({ data: jobs })
  } catch (error) {
    console.error('[GET /api/jobs/mine]', error)
    return NextResponse.json({ error: '일감 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/jobs/mine/route.ts
git commit -m "feat: 내 일감 목록 API에 지원자 수 포함"
```

---

## Task 4: 지원 수락 시 job → in_progress 자동 전환

**Files:**
- Modify: `app/api/applications/[id]/status/route.ts`

- [ ] **Step 1: 수락 시 job 상태 전환 로직 추가**

기존 파일에서 `// 검토중 전환 시 채팅방 생성` 블록 아래에 수락 시 처리 추가. 파일 전체 교체:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/applications/[id]/status — 지원 상태 변경 (소장: 검토중/수락/거절)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { status } = await request.json()

    const validStatuses = ['reviewing', 'accepted', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 })
    }

    // 소장이 본인 일감의 지원인지 확인
    const { data: application } = await supabase
      .from('applications')
      .select('id, job_id, jobs(manager_id)')
      .eq('id', params.id)
      .single()

    if (!application) {
      return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    const job = (application.jobs as unknown) as { manager_id: string } | null
    if (job?.manager_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // 검토중 전환 시 채팅방 생성
    if (status === 'reviewing') {
      await supabase.from('chats').insert({
        job_id: application.job_id,
        application_id: params.id,
      })
    }

    // 수락 시 일감 상태 → in_progress
    if (status === 'accepted') {
      await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', application.job_id)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/applications/[id]/status]', error)
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/applications/[id]/status/route.ts
git commit -m "feat: 지원 수락 시 일감 상태 in_progress 자동 전환"
```

---

## Task 5: NavButtons에 소장 전용 내 일감 링크 추가

**Files:**
- Modify: `components/features/home/NavButtons.tsx`

- [ ] **Step 1: 데스크톱 nav 수정 — 소장 로그인 시 "내 일감" 링크 추가**

`useAuthStore`에서 `role`을 추가로 구독. 파일에서 아래 두 부분 수정:

```typescript
// 상단 import 아래 — store에서 role 추가
const { user, role, isLoading } = useAuthStore()
```

데스크톱 로그인 상태 블록(`hidden md:flex`)에 내 일감 링크 추가:

```tsx
{user ? (
  <div className="hidden md:flex items-center gap-3">
    {role === 'manager' && (
      <Link href="/manager/jobs" className="text-sm text-slate-300 hover:text-white transition-colors">
        내 일감
      </Link>
    )}
    <Link href="/mypage" className="text-sm text-slate-300 hover:text-white transition-colors">
      마이페이지
    </Link>
    <button
      onClick={handleLogout}
      className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-colors bg-white/5"
    >
      로그아웃
    </button>
  </div>
) : (
  // ... 기존 비로그인 블록 그대로
```

모바일 드롭다운 메뉴에도 추가 (로그인 블록 안 첫 번째 항목 위):

```tsx
{role === 'manager' && (
  <Link
    href="/manager/jobs"
    onClick={close}
    className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-white/10 transition-colors"
  >
    <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
    내 일감
  </Link>
)}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 3: 커밋**

```bash
git add components/features/home/NavButtons.tsx
git commit -m "feat: 소장 전용 내 일감 nav 링크 추가"
```

---

## Task 6: 소장 내 일감 목록 페이지

**Files:**
- Create: `components/features/manager/ManagerJobCard.tsx`
- Create: `components/features/manager/ManagerJobStatusFilter.tsx`
- Modify: `app/manager/jobs/page.tsx`

- [ ] **Step 1: ManagerJobCard 컴포넌트 생성**

`components/features/manager/ManagerJobCard.tsx` 전체 코드:

```tsx
// 소장 내 일감 카드 — 상태 뱃지, 지원자 수, 작업일 표시
import Link from 'next/link'
import type { Job, JobStatus, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, JOB_TYPE_LABELS, JOB_STATUS_LABELS, PAY_DUE_LABELS } from '@/types'

interface ManagerJobCardProps {
  job: Job & { applicant_count: number; pending_count: number }
}

const STATUS_STYLE: Record<JobStatus, string> = {
  open:        'bg-emerald-100 text-emerald-700',
  closed:      'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-purple-100 text-purple-700',
  settled:     'bg-emerald-100 text-emerald-700',
}

export function ManagerJobCard({ job }: ManagerJobCardProps) {
  const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric', weekday: 'short',
  })

  const today = new Date().toISOString().split('T')[0]
  const effectiveStatus: JobStatus =
    job.status === 'open' && job.work_date < today ? 'closed' : job.status

  const showApplicants = effectiveStatus === 'open' || effectiveStatus === 'closed'

  return (
    <Link href={showApplicants ? `/manager/jobs/${job.id}/applicants` : `/jobs/${job.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">

        {/* 상단 뱃지 행 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[effectiveStatus]}`}>
            {JOB_STATUS_LABELS[effectiveStatus]}
          </span>
          {(job.equipment_codes as EquipmentCode[]).map((code) => (
            <span key={code} className="bg-brand-blue text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              {EQUIPMENT_LABELS[code]}
            </span>
          ))}
          <span className="ml-auto text-xs text-gray-400">{workDate}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{job.title}</h3>

        {/* 위치 */}
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {job.location}
        </p>

        {/* 하단 — 지원자 수 or 상태 안내 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{PAY_DUE_LABELS[job.pay_due_type]}</span>
          {showApplicants ? (
            <div className="flex items-center gap-1.5">
              {job.pending_count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  NEW {job.pending_count}
                </span>
              )}
              <span className="text-xs text-gray-500">지원자 {job.applicant_count}명 →</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">
              {effectiveStatus === 'in_progress' && '작업중'}
              {effectiveStatus === 'completed' && '정산 대기중'}
              {effectiveStatus === 'settled' && '정산 완료'}
            </span>
          )}
        </div>

      </div>
    </Link>
  )
}
```

- [ ] **Step 2: ManagerJobStatusFilter 컴포넌트 생성**

`components/features/manager/ManagerJobStatusFilter.tsx` 전체 코드:

```tsx
'use client'

// 소장 내 일감 목록 상태 필터 탭
import type { JobStatus } from '@/types'

type FilterValue = 'all' | JobStatus

interface Props {
  value: FilterValue
  onChange: (v: FilterValue) => void
}

const TABS: { value: FilterValue; label: string }[] = [
  { value: 'all',        label: '전체' },
  { value: 'open',       label: '모집중' },
  { value: 'closed',     label: '마감' },
  { value: 'in_progress',label: '작업중' },
  { value: 'completed',  label: '완료' },
  { value: 'settled',    label: '정산' },
]

export function ManagerJobStatusFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
            value === tab.value
              ? 'bg-brand-blue text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: ManagerJobsPage 구현**

`app/manager/jobs/page.tsx` 전체 코드:

```tsx
'use client'

// 소장 내 일감 목록 페이지
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { ManagerJobCard } from '@/components/features/manager/ManagerJobCard'
import { ManagerJobStatusFilter } from '@/components/features/manager/ManagerJobStatusFilter'
import type { Job, JobStatus } from '@/types'

type FilterValue = 'all' | JobStatus

interface JobWithCount extends Job {
  applicant_count: number
  pending_count: number
}

export default function ManagerJobsPage() {
  const { user, role, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('all')

  useEffect(() => {
    if (!authLoading && (!user || role !== 'manager')) {
      router.replace('/jobs')
    }
  }, [user, role, authLoading, router])

  useEffect(() => {
    if (!user || role !== 'manager') return
    setIsLoading(true)
    fetch('/api/jobs/mine')
      .then((r) => r.json())
      .then(({ data }) => setJobs(data ?? []))
      .finally(() => setIsLoading(false))
  }, [user, role])

  const today = new Date().toISOString().split('T')[0]

  const filtered = jobs.filter((job) => {
    const effective: JobStatus =
      job.status === 'open' && job.work_date < today ? 'closed' : job.status
    return filter === 'all' || effective === filter
  })

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Diggo" className="w-8 h-6 object-contain" />
            <span className="text-lg font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>
          <span className="text-sm font-semibold text-white">내 일감</span>
          <Link
            href="/jobs/new"
            className="text-sm bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-colors"
          >
            + 등록
          </Link>
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* 필터 탭 */}
          <div className="mb-5">
            <ManagerJobStatusFilter value={filter} onChange={setFilter} />
          </div>

          {/* 일감 목록 */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-28" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm mb-4">
                {filter === 'all' ? '등록한 일감이 없습니다.' : '해당 상태의 일감이 없습니다.'}
              </p>
              {filter === 'all' && (
                <Link
                  href="/jobs/new"
                  className="inline-block bg-brand-blue text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-blue-600 transition-colors"
                >
                  첫 일감 등록하기
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <ManagerJobCard key={job.id} job={job} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 5: 커밋**

```bash
git add components/features/manager/ app/manager/jobs/page.tsx
git commit -m "feat: 소장 내 일감 목록 페이지 구현"
```

---

## Task 7: 지원자 목록 페이지

**Files:**
- Create: `components/features/manager/ApplicantCard.tsx`
- Modify: `app/manager/jobs/[id]/applicants/page.tsx`

- [ ] **Step 1: ApplicantCard 컴포넌트 생성**

`components/features/manager/ApplicantCard.tsx` 전체 코드:

```tsx
// 지원자 카드 컴포넌트
import Link from 'next/link'
import type { ApplicationStatus } from '@/types'
import { APPLICATION_STATUS_LABELS, EQUIPMENT_LABELS } from '@/types'
import type { EquipmentCode } from '@/types'

interface ApplicantCardProps {
  jobId: string
  application: {
    id: string
    status: ApplicationStatus
    applied_at: string
    profiles: {
      id: string
      name: string
      rating_avg: number
      is_certified: boolean
      experience_years: number | null
    }
    equipments: {
      id: string
      model_code: EquipmentCode
      license_number: string | null
    } | null
  }
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-500',
}

export function ApplicantCard({ jobId, application }: ApplicantCardProps) {
  const { profiles: driver, equipments: equipment } = application
  const appliedAt = new Date(application.applied_at).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric',
  })

  return (
    <Link href={`/manager/jobs/${jobId}/applicants/${application.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">

          {/* 기사 정보 */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
              {driver.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-bold text-gray-900">{driver.name}</span>
                {driver.is_certified && (
                  <span className="inline-flex items-center justify-center bg-brand-blue text-white w-4 h-4 rounded-full shrink-0">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-yellow-400">★</span>
                <span>{driver.rating_avg.toFixed(1)}</span>
                {driver.experience_years !== null && (
                  <><span className="text-gray-200">·</span><span>경력 {driver.experience_years}년</span></>
                )}
                {equipment && (
                  <><span className="text-gray-200">·</span>
                  <span className="bg-brand-blue text-white font-bold px-1.5 py-0.5 rounded text-xs">
                    {EQUIPMENT_LABELS[equipment.model_code]}
                  </span></>
                )}
              </div>
            </div>
          </div>

          {/* 상태 + 날짜 */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[application.status]}`}>
              {APPLICATION_STATUS_LABELS[application.status]}
            </span>
            <span className="text-xs text-gray-400">{appliedAt} 지원</span>
          </div>

        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: 지원자 목록 페이지 구현**

`app/manager/jobs/[id]/applicants/page.tsx` 전체 코드:

```tsx
// 소장 — 특정 일감의 지원자 목록 페이지
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ApplicantCard } from '@/components/features/manager/ApplicantCard'
import type { ApplicationStatus, JobStatus, EquipmentCode } from '@/types'
import { JOB_STATUS_LABELS } from '@/types'

interface Props {
  params: { id: string }
}

const JOB_STATUS_STYLE: Record<JobStatus, string> = {
  open:        'bg-emerald-100 text-emerald-700',
  closed:      'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-purple-100 text-purple-700',
  settled:     'bg-emerald-100 text-emerald-700',
}

export default async function ApplicantsPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, work_date, status, equipment_codes, location')
    .eq('id', params.id)
    .eq('manager_id', user.id)
    .single()

  if (jobError || !job) notFound()

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at,
      profiles(id, name, rating_avg, is_certified, experience_years),
      equipments(id, model_code, license_number)
    `)
    .eq('job_id', params.id)
    .order('applied_at', { ascending: false })

  const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  })

  const today = new Date().toISOString().split('T')[0]
  const effectiveStatus: JobStatus =
    job.status === 'open' && job.work_date < today ? 'closed' : job.status as JobStatus

  return (
    <main className="min-h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/manager/jobs" className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-gray-700">지원자 목록</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* 일감 요약 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${JOB_STATUS_STYLE[effectiveStatus]}`}>
              {JOB_STATUS_LABELS[effectiveStatus]}
            </span>
            {(job.equipment_codes as EquipmentCode[]).map((code) => (
              <span key={code} className="bg-brand-blue text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {code}
              </span>
            ))}
          </div>
          <h1 className="text-base font-bold text-gray-900 mb-1">{job.title}</h1>
          <p className="text-xs text-gray-400">{workDate} · {job.location}</p>
        </div>

        {/* 지원자 수 */}
        <p className="text-sm font-semibold text-gray-700 mb-3">
          지원자 {(applications ?? []).length}명
        </p>

        {/* 지원자 목록 */}
        {(applications ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">아직 지원자가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(applications ?? []).map((app) => (
              <ApplicantCard
                key={app.id}
                jobId={params.id}
                application={app as {
                  id: string
                  status: ApplicationStatus
                  applied_at: string
                  profiles: { id: string; name: string; rating_avg: number; is_certified: boolean; experience_years: number | null }
                  equipments: { id: string; model_code: EquipmentCode; license_number: string | null } | null
                }}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
```

- [ ] **Step 3: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 4: 커밋**

```bash
git add components/features/manager/ApplicantCard.tsx app/manager/jobs/[id]/applicants/page.tsx
git commit -m "feat: 지원자 목록 페이지 구현"
```

---

## Task 8: 지원자 상세 & 수락/거절 페이지

**Files:**
- Create: `components/features/manager/ApplicantActions.tsx`
- Modify: `app/manager/jobs/[id]/applicants/[applicationId]/page.tsx`

- [ ] **Step 1: ApplicantActions 클라이언트 컴포넌트 생성**

`components/features/manager/ApplicantActions.tsx` 전체 코드:

```tsx
'use client'

// 지원자 상세 — 상태 변경 액션 버튼 (검토중 / 수락 / 거절)
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ApplicationStatus } from '@/types'

interface Props {
  applicationId: string
  currentStatus: ApplicationStatus
  jobId: string
}

export function ApplicantActions({ applicationId, currentStatus, jobId }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleChange(status: ApplicationStatus) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '요청 실패')

      if (status === 'accepted') {
        toast.success('기사님을 수락했습니다. 일감이 작업중으로 전환됩니다.')
        router.push('/manager/jobs')
      } else if (status === 'rejected') {
        toast.success('지원을 거절했습니다.')
        router.push(`/manager/jobs/${jobId}/applicants`)
      } else {
        toast.success('검토중으로 변경되었습니다.')
        router.refresh()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStatus === 'accepted') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
        <p className="text-emerald-700 font-semibold text-sm">수락 완료</p>
        <p className="text-emerald-600 text-xs mt-1">일감이 작업중 상태로 전환됩니다.</p>
      </div>
    )
  }

  if (currentStatus === 'rejected') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
        <p className="text-gray-500 font-semibold text-sm">거절된 지원</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {currentStatus === 'pending' && (
        <button
          onClick={() => handleChange('reviewing')}
          disabled={isLoading}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3.5 rounded-2xl transition-colors text-sm border border-blue-200 disabled:opacity-50"
        >
          {isLoading ? '처리 중...' : '채팅하며 검토하기'}
        </button>
      )}
      <button
        onClick={() => handleChange('accepted')}
        disabled={isLoading}
        className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm disabled:opacity-50"
      >
        {isLoading ? '처리 중...' : '기사 수락 (배차 확정)'}
      </button>
      <button
        onClick={() => handleChange('rejected')}
        disabled={isLoading}
        className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors py-1 disabled:cursor-not-allowed"
      >
        거절하기
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 지원자 상세 페이지 구현**

`app/manager/jobs/[id]/applicants/[applicationId]/page.tsx` 전체 코드:

```tsx
// 소장 — 지원자 상세 페이지 (기사 프로필 + 수락/거절 액션)
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ApplicantActions } from '@/components/features/manager/ApplicantActions'
import type { ApplicationStatus, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, APPLICATION_STATUS_LABELS } from '@/types'

interface Props {
  params: { id: string; applicationId: string }
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-500',
}

export default async function ApplicantDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at,
      profiles(id, name, rating_avg, is_certified, experience_years, phone, preferred_equipment_codes),
      equipments(id, model_code, license_number),
      jobs(id, title, manager_id)
    `)
    .eq('id', params.applicationId)
    .single()

  if (error || !application) notFound()

  const job = application.jobs as unknown as { id: string; title: string; manager_id: string }
  if (job.manager_id !== user.id) notFound()

  const driver = application.profiles as unknown as {
    id: string; name: string; rating_avg: number; is_certified: boolean
    experience_years: number | null; phone: string | null
    preferred_equipment_codes: EquipmentCode[]
  }
  const equipment = application.equipments as unknown as {
    id: string; model_code: EquipmentCode; license_number: string | null
  } | null

  const appliedAt = new Date(application.applied_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gray-50 pb-8">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/manager/jobs/${params.id}/applicants`} className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-gray-700">지원자 상세</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* 기사 프로필 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl shrink-0">
              {driver.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold text-gray-900">{driver.name}</span>
                {driver.is_certified && (
                  <span className="inline-flex items-center gap-1 bg-brand-blue text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    인증 기사
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-yellow-400">★</span>
                <span>{driver.rating_avg.toFixed(1)}</span>
                {driver.experience_years !== null && (
                  <><span className="text-gray-200">·</span><span>경력 {driver.experience_years}년</span></>
                )}
              </div>
            </div>
          </div>

          {/* 보유 장비 */}
          {equipment && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-2">보유 장비</p>
              <div className="flex items-center gap-2">
                <span className="bg-brand-blue text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {EQUIPMENT_LABELS[equipment.model_code]}
                </span>
                {equipment.license_number && (
                  <span className="text-xs text-gray-500">{equipment.license_number}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 지원 정보 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3">지원 정보</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{job.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{appliedAt} 지원</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[application.status as ApplicationStatus]}`}>
              {APPLICATION_STATUS_LABELS[application.status as ApplicationStatus]}
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3">지원 처리</p>
          <ApplicantActions
            applicationId={params.applicationId}
            currentStatus={application.status as ApplicationStatus}
            jobId={params.id}
          />
        </div>

      </div>
    </main>
  )
}
```

- [ ] **Step 3: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 4: 커밋**

```bash
git add components/features/manager/ApplicantActions.tsx app/manager/jobs/[id]/applicants/[applicationId]/page.tsx
git commit -m "feat: 지원자 상세 및 수락/거절 페이지 구현"
```

---

## Task 9: 빌드 검증 & dev 머지

- [ ] **Step 1: 전체 빌드 확인**

```bash
bun run build
```

에러 없으면 완료.

- [ ] **Step 2: dev 머지**

```bash
git checkout dev
git merge feat/manager-jobs --no-ff -m "feat: 소장 내 일감 관리 및 지원자 관리 구현"
```
