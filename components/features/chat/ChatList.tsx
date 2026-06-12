'use client'

// 채팅 목록 — 헤더(뒤로가기+이름) + 검색 인풋 + 카드
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ChatRoomWithDetails } from '@/types'

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
  currentUserName?: string
}

export default function ChatList({ rooms, currentUserId, currentUserName }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // 상대방 이름·마지막 메시지·일감 제목으로 실시간 필터링
  const filtered = searchQuery.trim()
    ? rooms.filter((room) => {
        const isManager = currentUserId === room.manager_id
        const opponent = isManager ? room.driver : room.manager
        const q = searchQuery.toLowerCase()
        return (
          opponent?.name?.toLowerCase().includes(q) ||
          room.last_message?.message?.toLowerCase().includes(q) ||
          room.jobs?.title?.toLowerCase().includes(q)
        )
      })
    : rooms

  return (
    <div className="min-h-screen bg-white">
      {/* ── 상단 고정 헤더 ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200/80 shadow-sm">
        {/* 뒤로가기 + 이름 */}
        <div className="flex items-center gap-1 px-3 pt-5 pb-2">
          <button
            onClick={() => router.push('/mypage/applications')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
            aria-label="뒤로가기"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[17px] font-black text-slate-900 tracking-tight">
            {currentUserName ?? '채팅'}
          </span>
        </div>
        {/* 검색 인풋 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3.5 py-2">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-gray-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="검색 초기화"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 목록 ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-4xl">💬</p>
          <p className="text-sm text-gray-400">
            {searchQuery ? '검색 결과가 없습니다.' : '아직 채팅방이 없습니다.'}
          </p>
          {!searchQuery && (
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
                  className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
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
                      } ${last?.is_deleted ? 'italic' : ''}`}>
                        {last?.is_deleted
                          ? '삭제된 메시지입니다.'
                          : last?.message ?? '대화를 시작해 보세요'}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
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
