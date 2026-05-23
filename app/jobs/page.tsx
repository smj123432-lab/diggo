// 일감 목록 — SSR + 30초 revalidate + TanStack Query HydrationBoundary
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { JobList } from '@/components/features/jobs/JobList'
import { DEFAULT_FILTERS } from '@/hooks/useJobs'

export const revalidate = 30

export default async function JobsPage() {
  const queryClient = new QueryClient()

  // 서버에서 첫 페이지 프리페치
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['jobs', DEFAULT_FILTERS],
    queryFn: async ({ pageParam }) => {
      const supabase = await createClient()
      const page = pageParam as number
      const limit = 12
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, count } = await supabase
        .from('jobs')
        .select('*, profiles(id, name, rating_avg, is_certified)', { count: 'exact' })
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .range(from, to)

      return { data: data ?? [], count: count ?? 0, page, limit }
    },
    initialPageParam: 1,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <ExcavatorIcon className="w-7 h-5 text-blue-400" />
            <span className="text-base font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>

          {/* 중앙 네비게이션 */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/jobs"
              className="px-4 py-2 text-sm font-semibold text-white bg-white/10 rounded-lg"
            >
              일감 찾기
            </Link>
            <Link
              href="/mypage"
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              마이페이지
            </Link>
            <Link
              href="/mypage/ledger"
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              장부
            </Link>
          </div>

          {/* 우측 버튼 */}
          <NavButtons />
        </div>
      </nav>

      {/* 콘텐츠 */}
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <JobList />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  )
}
