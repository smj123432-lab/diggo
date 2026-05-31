import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/ledger/expenses/[id] — 지출 삭제 (기사 본인만)
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { error } = await supabase
      .from('ledger_expenses')
      .delete()
      .eq('id', id)
      .eq('driver_id', user.id)

    if (error) throw error

    return NextResponse.json({ message: '삭제되었습니다.' })
  } catch (error) {
    console.error('[DELETE /api/ledger/expenses/[id]]', error)
    return NextResponse.json({ error: '지출 삭제에 실패했습니다.' }, { status: 500 })
  }
}
