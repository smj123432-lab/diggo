import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/admin/certifications/[id] — 승인 또는 거절 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { action } = await request.json() as { action: string }
    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: '잘못된 액션입니다.' }, { status: 400 })
    }

    const { id } = await params

    const admin = createAdminClient()

    const { data: cert, error: certErr } = await admin
      .from('certifications')
      .update({ status: action, verified_at: new Date().toISOString() })
      .eq('id', id)
      .select('driver_id')
      .single()
    if (certErr) throw certErr

    // 면허증 + 안전교육 이수증 모두 approved일 때만 is_certified = true
    if (action === 'approved') {
      const { data: allCerts } = await admin
        .from('certifications')
        .select('cert_type, status')
        .eq('driver_id', cert.driver_id)

      const approvedTypes = new Set(
        (allCerts ?? []).filter(c => c.status === 'approved').map(c => c.cert_type)
      )
      const fullyCertified = approvedTypes.has('license') && approvedTypes.has('safety_education')

      if (fullyCertified) {
        const { error: profileErr } = await admin
          .from('profiles')
          .update({ is_certified: true })
          .eq('id', cert.driver_id)
        if (profileErr) throw profileErr
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[PATCH /api/admin/certifications/[id]]', e)
    return NextResponse.json({ error: '처리에 실패했습니다.' }, { status: 500 })
  }
}
