// 마이페이지 — 상단 프로필 + 2단 스플릿 그리드 (좌: 계정설정 / 우: 역할별 메인)
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'
import { DeleteAccountButton } from '@/components/features/mypage/MypageActions'
import { InlineProfileCard } from '@/components/features/mypage/InlineProfileCard'
import { DriverInfoCard } from '@/components/features/mypage/DriverInfoCard'
import { CertDriverList, type DriverEntry } from '@/components/features/admin/CertDriverList'
import { FileText, ShieldAlert, Star } from 'lucide-react'
import type { EquipmentCode } from '@/types'

interface DisputeRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: { id: string; name: string; role: string } | null
  reviewee: { id: string; name: string; role: string } | null
  job: { id: string; title: string } | null
}

const CERT_STATUS_TABS = [
  { label: '전체', value: 'all' },
  { label: '대기중', value: 'pending' },
  { label: '승인', value: 'approved' },
  { label: '거절', value: 'rejected' },
]

const DISPUTE_ROLE_TABS = [
  { label: '전체', value: 'all' },
  { label: '소장이 쓴 리뷰', value: 'manager' },
  { label: '기사가 쓴 리뷰', value: 'driver' },
]

const ROLE_LABEL: Record<string, string> = { manager: '소장', driver: '기사', admin: '관리자' }

export default async function MypagePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; drole?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { tab: rawTab, status: rawStatus, drole: rawDRole } = await searchParams
  const adminTab = rawTab === 'disputes' ? 'disputes' : 'certs'
  const certStatus = rawStatus ?? 'pending'
  const disputeRole = rawDRole ?? 'all'

  // 역할별 데이터
  let jobCount = 0
  let equipments: { id: string; model_code: EquipmentCode }[] = []
  let certApproved = false
  let certPending = false

  // 관리자 전용
  let drivers: DriverEntry[] = []
  let pendingCertCount = 0
  let disputes: DisputeRow[] = []
  let totalDisputeCount = 0

  if (profile.role === 'manager') {
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('manager_id', user.id)
    jobCount = count ?? 0
  }

  if (profile.role === 'driver') {
    const { data: eqs } = await supabase
      .from('equipments')
      .select('id, model_code')
      .eq('owner_id', user.id)
    equipments = (eqs ?? []) as { id: string; model_code: EquipmentCode }[]

    const { data: driverCerts } = await supabase
      .from('certifications')
      .select('cert_type, status')
      .eq('driver_id', user.id)
    const approvedTypes = new Set(
      (driverCerts ?? []).filter(c => c.status === 'approved').map(c => c.cert_type)
    )
    certApproved = approvedTypes.has('license') && approvedTypes.has('safety_education')
    certPending = !certApproved && (driverCerts ?? []).some(c => c.status === 'pending')
  }

  if (profile.role === 'admin') {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── 서류 + 저평점 리뷰 병렬 패칭 ──
    // reviews 테이블이 profiles를 두 FK로 참조해 PostgREST embedded join이 불안정하므로
    // reviews만 먼저 가져온 뒤 profiles/jobs를 별도 쿼리로 fetch해 JS에서 직접 병합한다.
    const [certResult, reviewResult] = await Promise.all([
      adminClient
        .from('certifications')
        .select('id, driver_id, cert_type, image_url, status, created_at')
        .order('created_at', { ascending: false }),
      adminClient
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id, reviewee_id, job_id')
        .lte('rating', 2)
        .order('created_at', { ascending: false }),
    ])

    if (certResult.error) {
      console.error('[admin] certifications fetch error:', JSON.stringify(certResult.error))
    }
    if (reviewResult.error) {
      console.error('[admin] reviews fetch error:', JSON.stringify(reviewResult.error))
    }

    const allCertData = certResult.data ?? []
    const rawReviews = reviewResult.data ?? []

    // 리뷰에서 참조하는 profile ID·job ID 수집
    const reviewerIds = [...new Set(rawReviews.map(r => r.reviewer_id).filter(Boolean))] as string[]
    const revieweeIds = [...new Set(rawReviews.map(r => r.reviewee_id).filter(Boolean))] as string[]
    const jobIdsForReview = [...new Set(rawReviews.map(r => r.job_id).filter(Boolean))] as string[]
    const allProfileIds = [...new Set([...reviewerIds, ...revieweeIds])]

    // 관련 profiles, jobs 병렬 fetch
    const [reviewProfilesResult, reviewJobsResult] = await Promise.all([
      allProfileIds.length > 0
        ? adminClient.from('profiles').select('id, name, role').in('id', allProfileIds)
        : Promise.resolve({ data: [] as { id: string; name: string; role: string }[] }),
      jobIdsForReview.length > 0
        ? adminClient.from('jobs').select('id, title').in('id', jobIdsForReview)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ])

    const reviewProfileMap = Object.fromEntries(
      (reviewProfilesResult.data ?? []).map(p => [p.id, p])
    )
    const reviewJobMap = Object.fromEntries(
      (reviewJobsResult.data ?? []).map(j => [j.id, j])
    )

    // JS에서 수동 병합
    const allDisputes: DisputeRow[] = rawReviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? null,
      created_at: r.created_at,
      reviewer: r.reviewer_id ? (reviewProfileMap[r.reviewer_id] ?? null) : null,
      reviewee: r.reviewee_id ? (reviewProfileMap[r.reviewee_id] ?? null) : null,
      job: r.job_id ? (reviewJobMap[r.job_id] ?? null) : null,
    }))

    // 역할 기반 클라이언트 필터
    disputes =
      disputeRole === 'manager'
        ? allDisputes.filter(d => d.reviewer?.role === 'manager')
        : disputeRole === 'driver'
        ? allDisputes.filter(d => d.reviewer?.role === 'driver')
        : allDisputes
    totalDisputeCount = allDisputes.length

    // 탭 뱃지용 — 전체 데이터에서 pending 건수 산출
    pendingCertCount = allCertData.filter(c => c.status === 'pending').length

    const driverIds = Array.from(new Set(allCertData.map(c => c.driver_id)))
    const [profilesResult, authResult] = await Promise.all([
      driverIds.length > 0
        ? adminClient.from('profiles').select('id, name, phone, avatar_url').in('id', driverIds)
        : Promise.resolve({ data: [] as { id: string; name: string; phone: string; avatar_url: string | null }[] }),
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
    ])

    const profileMap = Object.fromEntries((profilesResult.data ?? []).map(p => [p.id, p]))
    const emailMap = Object.fromEntries(authResult.data.users.map(u => [u.id, u.email ?? '']))

    // 드라이버별 그룹화
    const driverCertMap: Record<string, typeof allCertData> = {}
    for (const cert of allCertData) {
      if (!driverCertMap[cert.driver_id]) driverCertMap[cert.driver_id] = []
      driverCertMap[cert.driver_id]!.push(cert)
    }

    // certStatus 필터 적용 (드라이버 단위)
    const filteredDriverIds = driverIds.filter(driverId => {
      const dc = driverCertMap[driverId] ?? []
      if (certStatus === 'pending') return dc.some(c => c.status === 'pending')
      if (certStatus === 'approved') return dc.every(c => c.status === 'approved')
      if (certStatus === 'rejected') return dc.some(c => c.status === 'rejected')
      return true // 'all'
    })

    drivers = filteredDriverIds.map(driverId => {
      const p = profileMap[driverId] as { name: string; phone: string; avatar_url: string | null } | undefined
      return {
        driverId,
        name: p?.name ?? '',
        email: emailMap[driverId] ?? '',
        phone: p?.phone ?? '',
        avatarUrl: p?.avatar_url ?? null,
        certs: (driverCertMap[driverId] ?? []).map(c => ({
          id: c.id,
          cert_type: c.cert_type,
          image_url: c.image_url,
          status: c.status,
        })),
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <ExcavatorIcon className="w-10 h-8 text-blue-400" />
            <span className="text-lg font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link href="/jobs" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              일감 찾기
            </Link>
            {profile.role !== 'admin' && (
              <Link href="/mypage/ledger" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                장부
              </Link>
            )}
            <NavRoleLink />
          </div>
          <NavButtons />
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

          {/* 프로필 카드 — 전체 너비 */}
          <InlineProfileCard profile={profile} jobCount={jobCount} />

          {/* 기사 정보 카드 — 전체 너비, 기사만 */}
          {profile.role === 'driver' && (
            <DriverInfoCard
              profile={profile}
              initialEquipments={equipments}
              certApproved={certApproved}
              certPending={certPending}
            />
          )}

          {/* ── 2단 스플릿 그리드 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

            {/* 우측: 메인 콘텐츠 (모바일에서 먼저) */}
            <div className="order-1 lg:order-2">
              {profile.role === 'admin' ? (

                /* ── 관리자 통합 관제 카드 ── */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* 50:50 탭 바 */}
                  <div className="grid grid-cols-2 border-b border-gray-100">
                    <Link
                      href="/mypage?tab=certs&status=pending"
                      className={`flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors ${
                        adminTab === 'certs'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>인증 서류 관리</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        adminTab === 'certs'
                          ? pendingCertCount > 0 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                          : pendingCertCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {pendingCertCount}
                      </span>
                    </Link>
                    <Link
                      href="/mypage?tab=disputes"
                      className={`flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors border-l border-gray-100 ${
                        adminTab === 'disputes'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>분쟁 평판 모니터링</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        adminTab === 'disputes'
                          ? totalDisputeCount > 0 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                          : totalDisputeCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {totalDisputeCount}
                      </span>
                    </Link>
                  </div>

                  {/* 탭별 필터 행 — 항상 동일한 공간 유지 */}
                  <div className="flex gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-white flex-wrap">
                    {adminTab === 'certs'
                      ? CERT_STATUS_TABS.map(t => (
                          <Link
                            key={t.value}
                            href={`/mypage?tab=certs&status=${t.value}`}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              certStatus === t.value
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-slate-400 hover:text-gray-700'
                            }`}
                          >
                            {t.label}
                          </Link>
                        ))
                      : DISPUTE_ROLE_TABS.map(t => (
                          <Link
                            key={t.value}
                            href={`/mypage?tab=disputes&drole=${t.value}`}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              disputeRole === t.value
                                ? 'bg-red-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600'
                            }`}
                          >
                            {t.label}
                          </Link>
                        ))
                    }
                  </div>

                  {/* 고정 높이 콘텐츠 영역 — 내부 독립 스크롤 */}
                  <div className="h-[400px] overflow-y-auto p-4">

                    {adminTab === 'certs' ? (
                      drivers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                          <FileText className="w-9 h-9 text-gray-200" />
                          <p className="text-sm font-medium">해당하는 서류가 없습니다.</p>
                        </div>
                      ) : (
                        <CertDriverList drivers={drivers} />
                      )
                    ) : (
                      disputes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                          <ShieldAlert className="w-9 h-9 text-gray-200" />
                          <p className="text-sm font-medium">저평점 리뷰가 없습니다.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {disputes.map(d => {
                            const date = new Date(d.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })
                            return (
                              <div key={d.id} className="bg-white rounded-xl border border-red-100 px-4 py-3.5">
                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="text-sm text-gray-700 font-medium shrink-0">
                                      {d.reviewer?.name ?? '(알 수 없음)'}
                                    </span>
                                    {d.reviewer?.role && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                        d.reviewer.role === 'manager'
                                          ? 'bg-blue-50 text-blue-600'
                                          : 'bg-orange-50 text-orange-600'
                                      }`}>
                                        {ROLE_LABEL[d.reviewer.role] ?? d.reviewer.role}
                                      </span>
                                    )}
                                    <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {d.reviewee ? (
                                      <Link
                                        href={`/profiles/${d.reviewee.id}`}
                                        className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors underline underline-offset-2 shrink-0"
                                      >
                                        {d.reviewee.name}
                                      </Link>
                                    ) : (
                                      <span className="text-sm font-bold text-slate-900 shrink-0">(알 수 없음)</span>
                                    )}
                                    {d.reviewee?.role && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                        d.reviewee.role === 'manager'
                                          ? 'bg-blue-50 text-blue-600'
                                          : 'bg-orange-50 text-orange-600'
                                      }`}>
                                        {ROLE_LABEL[d.reviewee.role] ?? d.reviewee.role}
                                      </span>
                                    )}
                                    {d.job && (
                                      <span className="text-xs text-gray-400 truncate">· {d.job.title}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
                                      <Star className="w-3 h-3 fill-red-500 text-red-500" />
                                      <span className="text-xs font-bold text-red-600">{d.rating}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{date}</span>
                                  </div>
                                </div>
                                {d.comment ? (
                                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
                                    {d.comment}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">내용 없음</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    )}

                  </div>
                </div>

              ) : (

                /* ── 일반 유저 활동 카드 ── */
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  <p className="px-5 pt-4 pb-2 text-sm font-bold text-slate-800">활동</p>
                  {profile.role === 'manager' ? (
                    <>
                      <Link href="/manager/jobs" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">내 일감 관리</span>
                        <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                      <Link href="/mypage/ledger" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                            <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">소장 장부</span>
                        <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                      <Link href="/mypage/reviews" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">받은 평가</span>
                        <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/mypage/applications" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">지원 현황</span>
                        <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                      <Link href="/mypage/ledger" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                            <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">기사 수당 장부</span>
                        <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                      <Link href="/mypage/reviews" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">받은 평가</span>
                        <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                    </>
                  )}
                </div>

              )}
            </div>

            {/* 좌측: 계정 설정 (모바일에서 아래, 데스크톱에서 sticky) */}
            <div className="order-2 lg:order-1">
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  <p className="px-5 pt-4 pb-2 text-sm font-bold text-slate-800">계정 설정</p>

                  {profile.role !== 'admin' && (
                    <Link href="/notifications" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                      <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                        <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">알림 설정</span>
                      <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                    </Link>
                  )}

                  <Link href="/mypage/password" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">비밀번호 변경</span>
                    <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                  </Link>

                  <DeleteAccountButton />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
