// 관리자 대시보드
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
          <div className="flex items-center gap-2">
            <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              일감 목록
            </Link>
            <Link href="/mypage" className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              마이페이지
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/certifications?status=pending"
            className="bg-white border border-gray-100 rounded-2xl px-6 py-5 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-bold text-gray-900 mb-1">인증 서류 관리</p>
            <p className="text-xs text-gray-400">면허·안전교육 서류 승인/거절</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
