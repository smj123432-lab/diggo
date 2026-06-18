// 일감 목록 — Static + "use cache" + TanStack Query HydrationBoundary
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getCachedJobsFirstPage } from '@/lib/utils/jobs-cache'
import { AppNav } from '@/components/features/home/AppNav'
import { JobList } from '@/components/features/jobs/JobList'
import { DEFAULT_FILTERS } from '@/hooks/useJobs'

export default async function JobsPage() {
  const queryClient = new QueryClient()

  // "use cache" 함수로 첫 페이지 프리페치 — cookies() 없음, Static 분류 가능
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['jobs', DEFAULT_FILTERS],
    queryFn: () => getCachedJobsFirstPage(),
    initialPageParam: 0,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <AppNav activeLink="jobs" />

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
