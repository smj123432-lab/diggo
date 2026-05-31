import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Supabase admin REST API로 이메일 존재 여부 확인
async function checkUserExists(email: string): Promise<boolean> {
  const url = new URL(
    `/auth/v1/admin/users`,
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )
  url.searchParams.set('filter', email)
  url.searchParams.set('per_page', '5')

  const res = await fetch(url.toString(), {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  })

  if (!res.ok) return false

  const { users } = await res.json()
  // filter는 like 검색이므로 정확한 이메일인지 재확인
  return Array.isArray(users) && users.some((u: { email?: string }) => u.email === email)
}

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json()

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 })
    }

    const exists = await checkUserExists(email)

    if (!exists) {
      return NextResponse.json(
        { error: '가입되지 않은 이메일 주소입니다. 다시 확인해 주세요.' },
        { status: 404 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }
}
