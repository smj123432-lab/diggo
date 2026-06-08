import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { PasswordChangeForm } from '@/components/features/mypage/PasswordChangeForm'
import { NavButtons } from '@/components/features/home/NavButtons'

export default async function PasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/mypage" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <ExcavatorIcon className="w-8 h-6 text-blue-400" />
            <span className="text-base font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>
          <h1 className="flex-1 text-sm font-semibold text-slate-300 ml-1">비밀번호 변경</h1>
          <NavButtons />
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-base font-black text-gray-900">비밀번호 변경</h2>
              <p className="text-xs text-gray-400 mt-1">현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.</p>
            </div>
            <PasswordChangeForm />
          </div>
        </div>
      </div>
    </div>
  )
}
