import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = 'https://diggo-zr4b.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  // 공개 일감 목록 (open 상태만)
  const { data: jobs } = await admin
    .from('jobs')
    .select('id, updated_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(200)

  const jobUrls: MetadataRoute.Sitemap = (jobs ?? []).map(job => ({
    url: `${BASE_URL}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at as string),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...jobUrls,
  ]
}
