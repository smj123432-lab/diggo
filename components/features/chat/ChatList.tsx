'use client'

// 당근마켓 스타일 채팅 목록 — 헤더 + 필터 칩 + 카드
import { useState } from 'react'
import Link from 'next/link'
import type { ChatRoomWithDetails } from '@/types'

type Filter = 'all' | 'read' | 'unread'

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',    label: '전체' },
  { value: 'read',   label: '읽음' },
  { value: 'unread', label: '안읽음' },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

function DefaultAvatar() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  )
}

interface Props {
  rooms: ChatRoomWithDetails[]
  currentUserId: string
}

export default function ChatList({ rooms, currentUserId }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = rooms.filter((room) => {
    const unread = room.unread_count ?? 0
    if (filter === 'read')   return unread === 0
    if (filter === 'unread') return unread > 0
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── 상단 고정 헤더 ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200/80 shadow-sm">
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-xl font-black text-slate-900">채팅</h1>
        </div>
        {/* 필터 칩 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors ${
                filter === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 목록 ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-4xl">💬</p>
          <p className="text-sm text-gray-400">
            {filter === 'all' ? '아직 채팅방이 없습니다.' : '해당 조건의 채팅방이 없습니다.'}
          </p>
          {filter === 'all' && (
            <p className="text-xs text-gray-300">
              일감 상세 또는 지원자 페이지에서 채팅을 시작하세요.
            </p>
          )}
        </div>
      ) : (
        <ul className="bg-white mt-2">
          {filtered.map((room) => {
            const isManager = currentUserId === room.manager_id
            const opponent  = isManager ? room.driver : room.manager
            const last      = room.last_message
            const unread    = room.unread_count ?? 0
            const timeStr   = last ? timeAgo(last.created_at) : timeAgo(room.created_at)

            return (
              <li key={room.id} className="border-b border-gray-200 last:border-0">
                <Link
                  href={`/chats/${room.id}`}
                  className="flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors"
                >
                  {/* 아바타 */}
                  <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden ring-1 ring-gray-100">
                    {opponent?.avatar_url ? (
                      <img
                        src={opponent.avatar_url}
                        alt={opponent.name ?? ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar />
                    )}
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="flex-1 min-w-0">
                    {/* 1줄: 이름 · 일감명 · 시간 (한 줄에 모두) */}
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[13px] font-bold text-slate-900 shrink-0 max-w-[5.5rem] truncate leading-tight">
                        {opponent?.name ?? '(알 수 없음)'}
                      </span>
                      {room.jobs?.title && (
                        <>
                          <span className="text-gray-300 text-[11px] shrink-0">·</span>
                          <span className="text-[11px] text-gray-400 truncate min-w-0 leading-tight">
                            {room.jobs.title}
                          </span>
                        </>
                      )}
                      <span className="text-[11px] text-gray-400 shrink-0 ml-auto pl-1 leading-tight">
                        {timeStr}
                      </span>
                    </div>
                    {/* 2줄: 마지막 메시지 + 미읽음 뱃지 */}
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] leading-snug line-clamp-1 flex-1 min-w-0 ${
                        unread > 0
                          ? 'text-slate-700 font-semibold'
                          : 'text-gray-400 font-normal'
                      }`}>
                        {last?.message ?? '대화를 시작해 보세요'}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white leading-none">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
