// 일감 목록 — SSR + 30초 revalidate + TanStack Query HydrationBoundary
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { JobList } from '@/components/features/jobs/JobList'

export const revalidate = 30

export default async function JobsPage() {
  const queryClient = new QueryClient()

  // 서버에서 첫 페이지 프리페치 — 클라이언트 hydration 시 캐시 히트
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['jobs', {}],
    queryFn: async ({ pageParam }) => {
      const supabase = await createClient()
      const page = pageParam as number
      const limit = 10
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
    <div className="min-h-screen bg-slate-950">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ExcavatorIcon className="w-7 h-5 text-blue-400" />
            <span className="text-base font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>
          <NavButtons />
        </div>
      </nav>

      {/* 헤더 높이(4rem) 확보 후 콘텐츠 */}
      <div className="pt-16">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <JobList />
        </HydrationBoundary>
      </div>
    </div>
  )
}
