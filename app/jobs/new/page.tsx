// 일감 등록 페이지 — 소장 전용, 비로그인/기사 접근 시 리다이렉트
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatLongDate } from '@/lib/utils/date'
import { AppNav } from '@/components/features/home/AppNav'
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
      <AppNav />

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
