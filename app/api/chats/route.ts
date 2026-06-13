import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/chats — 내 채팅방 목록
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('id, job_id, manager_id, driver_id, created_at')
      .or(`manager_id.eq.${user.id},driver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!rooms || rooms.length === 0) return NextResponse.json({ data: [] })

    const jobIds = [...new Set(rooms.map((r) => r.job_id))]
    const profileIds = [...new Set(rooms.flatMap((r) => [r.manager_id, r.driver_id]))]

    const [{ data: jobs }, { data: profiles }] = await Promise.all([
      supabase.from('jobs').select('id, title, work_date, equipment_codes').in('id', jobIds),
      supabase.from('profiles').select('id, name, avatar_url').in('id', profileIds),
    ])

    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]))
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    // 모든 room의 마지막 메시지·미읽음 수를 한 번에 조회하여 N+1 제거
    const roomIds = rooms.map((r) => r.id)
    const [{ data: allMessages }, { data: allUnread }] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('id, room_id, message, sender_id, created_at, is_deleted')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('chat_messages')
        .select('room_id')
        .in('room_id', roomIds)
        .eq('is_read', false)
        .neq('sender_id', user.id),
    ])

    // room_id별 마지막 메시지 Map (이미 created_at DESC 정렬 → 첫 번째가 최신)
    type LastMsg = { id: string; room_id: string; message: string; sender_id: string; created_at: string; is_deleted: boolean }
    const lastMsgMap = new Map<string, LastMsg>()
    for (const msg of (allMessages ?? []) as LastMsg[]) {
      if (!lastMsgMap.has(msg.room_id)) lastMsgMap.set(msg.room_id, msg)
    }

    // room_id별 미읽음 수 Map
    const unreadMap = new Map<string, number>()
    for (const msg of allUnread ?? []) {
      unreadMap.set(msg.room_id, (unreadMap.get(msg.room_id) ?? 0) + 1)
    }

    const enriched = rooms.map((room) => ({
      ...room,
      jobs: jobMap.get(room.job_id) ?? null,
      manager: profileMap.get(room.manager_id) ?? null,
      driver: profileMap.get(room.driver_id) ?? null,
      last_message: lastMsgMap.get(room.id) ?? null,
      unread_count: unreadMap.get(room.id) ?? 0,
    }))

    return NextResponse.json({ data: enriched })
  } catch (error) {
    console.error('[GET /api/chats]', error)
    return NextResponse.json({ error: '채팅 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}

// POST /api/chats — 채팅방 생성 또는 기존 방 반환 (소장·기사 누구나)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { job_id, driver_id } = await request.json() as { job_id: string; driver_id: string }
    if (!job_id || !driver_id) {
      return NextResponse.json({ error: 'job_id, driver_id가 필요합니다.' }, { status: 400 })
    }

    // 기존 방 조회
    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('job_id', job_id)
      .eq('driver_id', driver_id)
      .maybeSingle()

    if (existing) return NextResponse.json({ data: existing }, { status: 200 })

    // jobs에서 manager_id 조회
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('manager_id')
      .eq('id', job_id)
      .single()

    if (jobErr || !job) {
      return NextResponse.json({ error: '일감을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: created, error: insertErr } = await supabase
      .from('chat_rooms')
      .insert({ job_id, manager_id: job.manager_id, driver_id })
      .select()
      .single()

    if (insertErr) throw insertErr

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/chats]', error)
    return NextResponse.json({ error: '채팅방을 생성하지 못했습니다.' }, { status: 500 })
  }
}
