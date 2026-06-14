// 일감 등록 페이지 — 소장 전용, 비로그인/기사 접근 시 리다이렉트
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatLongDate } from '@/lib/utils/date'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'
import { JobForm } from '@/components/features/jobs/JobForm'

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, banned_until')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'manager' && profile?.role !== 'admin') redirect('/jobs')

  const isBanned = profile?.banned_until && new Date(profile.banned_until) > new Date()
  const bannedUntilStr = isBanned ? formatLongDate(profile.banned_until!) : null

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

      {/* 콘텐츠 */}
      <div className="pt-16">
        <div className="max-w-xl mx-auto px-6 py-10">
          {/* 헤더 */}
          <div className="mb-8">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
              일감 목록으로
            </Link>
            <h1 className="text-2xl font-black text-gray-900">일감 등록</h1>
            <p className="text-sm text-gray-400 mt-1">필수 항목을 모두 입력하면 등록 버튼이 활성화됩니다.</p>
          </div>

          {isBanned ? (
            <div className="flex items-start gap-4 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-5">
              <span className="text-2xl shrink-0">🚫</span>
              <div>
                <p className="text-base font-bold text-orange-700 mb-1">일감 등록 제한 중</p>
                <p className="text-sm text-orange-600">패널티 누적으로 <strong>{bannedUntilStr}</strong>까지 일감 등록이 제한됩니다.</p>
                <Link href="/mypage" className="inline-block mt-3 text-xs font-semibold text-orange-500 underline underline-offset-2">
                  마이페이지에서 확인하기
                </Link>
              </div>
            </div>
          ) : (
            <JobForm />
          )}
        </div>
      </div>
    </div>
  )
}
