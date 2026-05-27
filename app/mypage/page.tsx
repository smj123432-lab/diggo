// 마이페이지 — 프로필 + 역할별 메타 + 바로가기
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'
import { DeleteAccountButton } from '@/components/features/mypage/MypageActions'
import type { EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS } from '@/types'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  driver:  '기사',
  manager: '소장',
  admin:   '관리자',
}

export default async function MypagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // 역할별 추가 데이터
  let jobCount = 0
  let equipments: { id: string; model_code: EquipmentCode }[] = []
  let certApproved = false

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

    const { count } = await supabase
      .from('certifications')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', user.id)
      .eq('status', 'approved')
    certApproved = (count ?? 0) > 0
  }

  const initial = profile.name?.charAt(0) ?? '?'
  const roleLabel = ROLE_LABEL[profile.role] ?? profile.role
  // bio 컬럼이 profiles 테이블에 추가되면 표시됨 (ALTER TABLE profiles ADD COLUMN bio TEXT)
  const bio: string | null = ('bio' in profile) ? (profile as unknown as { bio: string | null }).bio : null

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
            <Link href="/mypage/ledger" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              장부
            </Link>
            <NavRoleLink />
          </div>
          <NavButtons />
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

          {/* ── 프로필 카드 ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-5">
              {/* 아바타 */}
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
                {initial}
              </div>

              {/* 이름·역할·전화번호·한 줄 소개 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-lg font-black text-gray-900">{profile.name}</h1>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {roleLabel}
                  </span>
                  {profile.is_certified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold border border-blue-200 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      인증
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-1">{profile.phone ?? '전화번호 미등록'}</p>
                {bio ? (
                  <p className="text-xs text-gray-500">&ldquo;{bio}&rdquo;</p>
                ) : (
                  <p className="text-xs text-gray-300 italic">한 줄 소개를 등록해 보세요</p>
                )}
              </div>

              {/* 기사 평점 */}
              {profile.role === 'driver' && (
                <div className="text-center shrink-0">
                  <p className="text-xs text-gray-400 mb-0.5">평점</p>
                  <p className="text-xl font-black text-gray-900">
                    <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
                  </p>
                </div>
              )}

              {/* 프로필 수정 버튼 */}
              <Link
                href="/mypage/edit"
                className="self-start shrink-0 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                프로필 수정
              </Link>
            </div>

            {/* 소장 배지 행 */}
            {profile.role === 'manager' && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                <span className="inline-flex items-center text-xs font-semibold border border-blue-200 text-blue-600 bg-white px-3 py-1 rounded-full">
                  누적 일감 {jobCount}건
                </span>
                {profile.garage_address && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold border border-gray-200 text-gray-600 bg-white px-3 py-1 rounded-full">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {profile.garage_address}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── 기사 정보 카드 ── */}
          {profile.role === 'driver' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-3">기사 정보</p>

              {/* 보유 장비 */}
              <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 mb-3">
                <p className="text-xs text-gray-400 mb-2">보유 장비</p>
                {equipments.length > 0 ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {equipments.map((eq) => (
                      <span key={eq.id} className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        {EQUIPMENT_LABELS[eq.model_code]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">등록된 장비 없음</p>
                )}
              </div>

              {/* 3-col 배지 그리드 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1.5">현장 경력</p>
                  <p className="text-sm font-bold text-gray-800">
                    {profile.experience_years != null ? `${profile.experience_years}년` : '—'}
                  </p>
                </div>
                <div className={`border rounded-xl p-3 text-center ${certApproved ? 'border-blue-100 bg-blue-50/30' : 'border-red-100 bg-red-50/30'}`}>
                  <p className="text-xs text-gray-400 mb-1.5">면허·안전교육</p>
                  {certApproved ? (
                    <p className="text-sm font-bold text-blue-600">이수완료</p>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-400">미등록</p>
                      <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        등록 필수
                      </span>
                    </div>
                  )}
                </div>
                <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1.5">평점</p>
                  <p className="text-sm font-bold text-gray-800">
                    <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 바로가기 그리드 ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

            {/* 좌측: 활동 메뉴 — 3등분 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
              <p className="px-5 pt-4 pb-2 text-sm font-bold text-slate-800 shrink-0">활동</p>
              <div className="flex flex-col flex-1 divide-y divide-gray-100">
                {profile.role === 'manager' ? (
                  <>
                    <Link href="/manager/jobs" className="flex-1 flex items-center gap-3 px-4 hover:bg-blue-50 transition-colors group">
                      <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                        <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">내 일감 관리</span>
                      <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                    </Link>
                    <Link href="/mypage/ledger" className="flex-1 flex items-center gap-3 px-4 hover:bg-blue-50 transition-colors group">
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
                    <Link href="/mypage/reviews" className="flex-1 flex items-center gap-3 px-4 hover:bg-blue-50 transition-colors group">
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
                    <Link href="/mypage/applications" className="flex-1 flex items-center gap-3 px-4 hover:bg-blue-50 transition-colors group">
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
                    <Link href="/mypage/ledger" className="flex-1 flex items-center gap-3 px-4 hover:bg-blue-50 transition-colors group">
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
                    <Link href="/mypage/reviews" className="flex-1 flex items-center gap-3 px-4 hover:bg-blue-50 transition-colors group">
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
            </div>

            {/* 우측: 계정 설정 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              <p className="px-5 pt-4 pb-2 text-sm font-bold text-slate-800">계정 설정</p>

              <Link href="/notifications" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">알림 설정</span>
                <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
              </Link>

              <Link href="/mypage/edit" className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
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
  )
}
