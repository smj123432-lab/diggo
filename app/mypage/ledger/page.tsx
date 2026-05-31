// 장부 페이지 — 서버 컴포넌트: 인증 확인 및 role 전달
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LedgerClientPage } from './LedgerClientPage'

export default async function LedgerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'driver'

  return <LedgerClientPage role={role} />
}
