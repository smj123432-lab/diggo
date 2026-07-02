// 일감 목록 — "use cache" 첫 페이지를 서버에서 직접 prop으로 전달해 SSR LCP 보장
import { getCachedJobsFirstPage } from '@/lib/utils/jobs-cache'
import { AppNav } from '@/components/features/home/AppNav'
import { JobList } from '@/components/features/jobs/JobList'

export default async function JobsPage() {
  // 서버에서 첫 페이지 데이터를 직접 fetch — HTML에 포함되어 LCP 즉시 측정
  const initialData = await getCachedJobsFirstPage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <AppNav activeLink="jobs" />

      {/* 콘텐츠 */}
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <JobList initialData={initialData} />
        </div>
      </div>
    </div>
  )
}
