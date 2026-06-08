'use client'

// 당근마켓 스타일 채팅 목록 — 헤더 + 필터 칩 + 카드
import { useState } from 'react'
import Link from 'next/link'
import type { ChatRoomWithDetails } from '@/types'

type Filter = 'all' | 'manager' | 'driver' | 'unread'

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',     label: '전체' },
  { value: 'manager', label: '소장 일감' },
  { value: 'driver',  label: '기사 지원' },
  { value: 'unread',  label: '안읽음' },
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
    <div className="w-full h-full flex items-center justify-center bg-gray-200">
      <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
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
    if (filter === 'manager') return room.manager_id === currentUserId
    if (filter === 'driver')  return room.driver_id  === currentUserId
    if (filter === 'unread')  return (room.unread_count ?? 0) > 0
    return true
  })

  return (
    <>
      {/* ── 상단 고정 헤더 ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        {/* 타이틀 + 아이콘 */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <h1 className="text-xl font-black text-slate-900">채팅</h1>
          <div className="flex items-center gap-0.5">
            {/* 알림 (종) */}
            <button
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="알림"
            >
              <svg className="w-6 h-6 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* 설정 (톱니바퀴) */}
            <button
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="설정"
            >
              <svg className="w-6 h-6 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 필터 칩 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`shrink-0 text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                filter === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            {filter === 'all'
              ? '아직 채팅방이 없습니다.'
              : '해당 조건의 채팅방이 없습니다.'}
          </p>
          {filter === 'all' && (
            <p className="text-xs text-gray-300">
              일감 상세 또는 지원자 페이지에서 채팅을 시작하세요.
            </p>
          )}
        </div>
      ) : (
        <ul>
          {filtered.map((room) => {
            const isManager = currentUserId === room.manager_id
            const opponent  = isManager ? room.driver : room.manager
            const last      = room.last_message
            const unread    = room.unread_count ?? 0
            const timeStr   = last
              ? timeAgo(last.created_at)
              : timeAgo(room.created_at)

            return (
              <li key={room.id} className="border-b border-gray-100 last:border-0">
                <Link
                  href={`/chats/${room.id}`}
                  className="flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition-colors"
                >
                  {/* 아바타 */}
                  <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden">
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

                  {/* 중앙 텍스트 */}
                  <div className="flex-1 min-w-0">
                    {/* 1줄: 이름 · 일감명 · 시간 */}
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 shrink-0 max-w-[7rem] truncate">
                        {opponent?.name ?? '(알 수 없음)'}
                      </span>
                      {room.jobs?.title && (
                        <>
                          <span className="text-gray-300 text-xs shrink-0">·</span>
                          <span className="text-xs text-gray-400 truncate min-w-0">
                            {room.jobs.title}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-400 shrink-0 ml-auto pl-2">
                        {timeStr}
                      </span>
                    </div>
                    {/* 2줄: 마지막 메시지 */}
                    <p className={`text-sm line-clamp-1 ${
                      unread > 0 ? 'text-slate-800 font-medium' : 'text-gray-400'
                    }`}>
                      {last?.message ?? '대화를 시작해 보세요'}
                    </p>
                  </div>

                  {/* 미읽음 뱃지 (주황색) */}
                  {unread > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
