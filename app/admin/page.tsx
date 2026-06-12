// 관리자 대시보드 — 인증 서류 관리 + 분쟁 평판 모니터링 통합
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { FileText, ShieldAlert, LayoutDashboard, Star } from 'lucide-react'
import { CertDriverList, type DriverEntry } from '@/components/features/admin/CertDriverList'

interface DisputeRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: { id: string; name: string } | null
  reviewee: { id: string; name: string } | null
  job: { id: string; title: string } | null
}

const STATUS_TABS = [
  { label: '전체', value: 'all' },
  { label: '대기중', value: 'pending' },
  { label: '승인', value: 'approved' },
  { label: '거절', value: 'rejected' },
]

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { tab: rawTab, status: rawStatus } = await searchParams
  const tab = rawTab === 'disputes' ? 'disputes' : 'certs'
  const status = rawStatus ?? 'pending'

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 인증 서류 탭 데이터
  let drivers: DriverEntry[] = []
  let pendingCertCount = 0

  const { data: certs } = await admin
    .from('certifications')
    .select('id, driver_id, cert_type, image_url, status, created_at')
    .order('created_at', { ascending: false })

  const { count: pendingCount } = await admin
    .from('certifications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  pendingCertCount = pendingCount ?? 0

  const driverIds = Array.from(new Set((certs ?? []).map(c => c.driver_id)))
  const { data: profilesData } = driverIds.length > 0
    ? await admin.from('profiles').select('id, name, phone, avatar_url').in('id', driverIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p]))

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries(authUsers.map(u => [u.id, u.email ?? '']))

  const driverCertMap: Record<string, typeof certs> = {}
  for (const cert of certs ?? []) {
    if (!driverCertMap[cert.driver_id]) driverCertMap[cert.driver_id] = []
    driverCertMap[cert.driver_id]!.push(cert)
  }

  const filteredDriverIds = driverIds.filter(driverId => {
    const dc = driverCertMap[driverId] ?? []
    if (status === 'pending') return dc.some(c => c.status === 'pending')
    if (status === 'approved') return dc.every(c => c.status === 'approved')
    if (status === 'rejected') return dc.some(c => c.status === 'rejected')
    return true
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

  // 분쟁 탭 데이터
  let disputes: DisputeRow[] = []
  if (tab === 'disputes') {
    const { data } = await admin
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        reviewer:reviewer_id(id, name),
        reviewee:reviewee_id(id, name),
        job:job_id(id, title)
      `)
      .in('rating', [1, 2])
      .order('created_at', { ascending: false })
    disputes = (data ?? []) as unknown as DisputeRow[]
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-5 h-5 text-slate-600" />
            <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
          </div>
          <Link
            href="/mypage"
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            마이페이지
          </Link>
        </div>

        {/* 탭 바 */}
        <div className="flex gap-2 mb-6">
          <Link
            href="/admin?tab=certs&status=pending"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'certs'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            인증 서류 관리
            {pendingCertCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                tab === 'certs' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {pendingCertCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin?tab=disputes"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'disputes'
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            분쟁 평판 모니터링
          </Link>
        </div>

        {/* 컨텐츠 */}
        {tab === 'certs' ? (
          <>
            {/* 인증 서류 — 상태 탭 */}
            <div className="flex gap-2 mb-5">
              {STATUS_TABS.map(t => (
                <Link
                  key={t.value}
                  href={`/admin?tab=certs&status=${t.value}`}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    status === t.value
                      ? 'bg-slate-700 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-slate-400'
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <CertDriverList drivers={drivers} />
          </>
        ) : (
          /* 분쟁 평판 모니터링 */
          disputes.length === 0 ? (
            <div className="text-center text-gray-400 py-20 bg-white rounded-2xl border border-gray-100">
              저평점 리뷰가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map(d => {
                const date = new Date(d.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })
                return (
                  <div
                    key={d.id}
                    className="bg-white rounded-2xl border border-red-100 px-5 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      {/* 리뷰어 → 피리뷰어 */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-sm text-gray-500">
                          {d.reviewer?.name ?? '(알 수 없음)'}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {d.reviewee ? (
                          <Link
                            href={`/profiles/${d.reviewee.id}`}
                            className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors underline underline-offset-2"
                          >
                            {d.reviewee.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-slate-900">(알 수 없음)</span>
                        )}
                        {d.job && (
                          <span className="text-xs text-gray-400 truncate">
                            · {d.job.title}
                          </span>
                        )}
                      </div>

                      {/* 평점 + 날짜 */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                          <Star className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          <span className="text-sm font-bold text-red-600">{d.rating}</span>
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
    </main>
  )
}
