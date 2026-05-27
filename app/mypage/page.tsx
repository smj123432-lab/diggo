// 마이페이지 — 인라인 수정 가능한 프로필 + 역할별 메타 + 바로가기
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'
import { DeleteAccountButton } from '@/components/features/mypage/MypageActions'
import { InlineProfileCard } from '@/components/features/mypage/InlineProfileCard'
import { InlineDriverInfoCard } from '@/components/features/mypage/InlineDriverInfoCard'

export const dynamic = 'force-dynamic'

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

  let jobCount = 0
  let certApproved = false

  if (profile.role === 'manager') {
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('manager_id', user.id)
    jobCount = count ?? 0
  }

  if (profile.role === 'driver') {
    const { count } = await supabase
      .from('certifications')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', user.id)
      .eq('status', 'approved')
    certApproved = (count ?? 0) > 0
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

          {/* 프로필 카드 — 인라인 수정 */}
          <InlineProfileCard profile={profile} jobCount={jobCount} />

          {/* 기사 정보 카드 — 인라인 수정 */}
          {profile.role === 'driver' && (
            <InlineDriverInfoCard profile={profile} certApproved={certApproved} />
          )}

          {/* 바로가기 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

            {/* 활동 */}
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

            {/* 계정 설정 */}
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
