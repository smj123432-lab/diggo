// 관리자 인증 서류 관리 페이지 — 기사별 카드 + 모달 검토
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { CertDriverList, type DriverEntry } from '@/components/features/admin/CertDriverList'

export const dynamic = 'force-dynamic'

const STATUS_TABS = [
  { label: '전체', value: 'all' },
  { label: '대기중', value: 'pending' },
  { label: '승인', value: 'approved' },
  { label: '거절', value: 'rejected' },
]

export default async function AdminCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { status: rawStatus } = await searchParams
  const status = rawStatus ?? 'pending'

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 전체 서류 조회 (필터는 드라이버 단위로 적용)
  const { data: certs } = await admin
    .from('certifications')
    .select('id, driver_id, cert_type, image_url, status, created_at')
    .order('created_at', { ascending: false })

  // 드라이버별 프로필 조회
  const driverIds = Array.from(new Set((certs ?? []).map(c => c.driver_id)))
  const { data: profilesData } = driverIds.length > 0
    ? await admin.from('profiles').select('id, name, phone').in('id', driverIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p]))

  // 이름 없는 경우 auth 이메일 fallback
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries(authUsers.map(u => [u.id, u.email ?? '']))

  // 드라이버별 그룹화
  const driverCertMap: Record<string, typeof certs> = {}
  for (const cert of certs ?? []) {
    if (!driverCertMap[cert.driver_id]) driverCertMap[cert.driver_id] = []
    driverCertMap[cert.driver_id]!.push(cert)
  }

  // 상태 필터 적용 (드라이버 단위)
  const filteredDriverIds = driverIds.filter(driverId => {
    const dc = driverCertMap[driverId] ?? []
    if (status === 'pending') return dc.some(c => c.status === 'pending')
    if (status === 'approved') return dc.every(c => c.status === 'approved')
    if (status === 'rejected') return dc.some(c => c.status === 'rejected')
    return true
  })

  const drivers: DriverEntry[] = filteredDriverIds.map(driverId => {
    const p = profileMap[driverId] as { name: string; phone: string } | undefined
    return {
      driverId,
      name: p?.name ?? '',
      email: emailMap[driverId] ?? '',
      phone: p?.phone ?? '',
      certs: (driverCertMap[driverId] ?? []).map(c => ({
        id: c.id,
        cert_type: c.cert_type,
        image_url: c.image_url,
        status: c.status,
      })),
    }
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
            ← 대시보드
          </Link>
          <h1 className="text-xl font-bold text-gray-900">인증 서류 관리</h1>
        </div>

        {/* 상태 탭 */}
        <div className="flex gap-2 mb-6">
          {STATUS_TABS.map(tab => (
            <Link
              key={tab.value}
              href={`/admin/certifications?status=${tab.value}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                status === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-slate-400'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* 기사별 카드 목록 */}
        <CertDriverList drivers={drivers} />
      </div>
    </main>
  )
}
