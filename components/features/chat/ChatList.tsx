'use client'

// 채팅방 목록 — 미읽음 뱃지, 마지막 메시지 미리보기
import Link from 'next/link'
import type { ChatRoomWithDetails } from '@/types'

interface Props {
  rooms: ChatRoomWithDetails[]
  currentUserId: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  return `${Math.floor(hour / 24)}일 전`
}

export default function ChatList({ rooms, currentUserId }: Props) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-4xl">💬</p>
        <p className="text-sm text-gray-400">아직 채팅방이 없습니다.</p>
        <p className="text-xs text-gray-300">일감 상세 또는 지원자 페이지에서 채팅을 시작하세요.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-100">
      {rooms.map((room) => {
        const opponent = currentUserId === room.manager_id ? room.driver : room.manager
        const last = room.last_message
        const unread = room.unread_count ?? 0

        return (
          <li key={room.id}>
            <Link
              href={`/chats/${room.id}`}
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* 아바타 */}
              <div className="shrink-0 w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                {opponent?.avatar_url ? (
                  <img src={opponent.avatar_url} alt={opponent.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                    {opponent?.name?.[0] ?? '?'}
                  </div>
                )}
              </div>

              {/* 텍스트 영역 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {opponent?.name ?? '상대방'}
                  </p>
                  {last && (
                    <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(last.created_at)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {room.jobs?.title ?? '일감'}
                </p>
                {last && (
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                    {last.message}
                  </p>
                )}
              </div>

              {/* 미읽음 뱃지 */}
              {unread > 0 && (
                <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
