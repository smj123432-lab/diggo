'use client'

// 데스크톱: 인스타그램 DM 스타일 좌우 분할 뷰 / 모바일: 단일 뷰
// 기능: 미읽음 카운트 실시간 업데이트 (Realtime INSERT 구독)
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ChatRoomWithDetails } from '@/types'
import ChatList from './ChatList'

interface Props {
  rooms: ChatRoomWithDetails[]
  currentUserId: string
  currentUserName: string
  children: React.ReactNode
}

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
      <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-white">
      <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center">
        <svg className="w-9 h-9 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-base font-bold text-slate-900">내 메시지</p>
        <p className="text-sm text-gray-400 mt-1.5">소장 또는 기사와 채팅을 시작해 보세요.</p>
      </div>
      <Link
        href="/jobs"
        className="mt-1 px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
      >
        일감 둘러보기
      </Link>
    </div>
  )
}

interface DesktopRoomListProps {
  rooms: ChatRoomWithDetails[]
  currentUserId: string
  activeRoomId?: string
}

function DesktopRoomList({ rooms, currentUserId, activeRoomId }: DesktopRoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
        <p className="text-2xl">💬</p>
        <p className="text-xs text-gray-400">아직 채팅방이 없습니다.</p>
      </div>
    )
  }

  return (
    <ul>
      {rooms.map((room) => {
        const isManager = currentUserId === room.manager_id
        const opponent = isManager ? room.driver : room.manager
        const last = room.last_message
        const unread = room.unread_count ?? 0
        const timeStr = last ? timeAgo(last.created_at) : timeAgo(room.created_at)
        const isActive = room.id === activeRoomId

        // 삭제된 메시지 미리보기 처리
        const previewText = last?.is_deleted
          ? '삭제된 메시지입니다.'
          : last?.message ?? '대화를 시작해 보세요'

        return (
          <li key={room.id}>
            <Link
              href={`/chats/${room.id}`}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <div className="shrink-0 w-11 h-11 rounded-full overflow-hidden ring-1 ring-gray-100">
                {opponent?.avatar_url ? (
                  <img src={opponent.avatar_url} alt={opponent.name ?? ''} className="w-full h-full object-cover" />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[13px] font-bold text-slate-900 truncate max-w-[9rem]">
                    {opponent?.name ?? '(알 수 없음)'}
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0 pl-2">{timeStr}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className={`text-[12px] line-clamp-1 flex-1 min-w-0 ${
                    unread > 0 ? 'text-slate-700 font-semibold' : 'text-gray-400'
                  } ${last?.is_deleted ? 'italic' : ''}`}>
                    {previewText}
                  </p>
                  {unread > 0 && (
                    <span className="shrink-0 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
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
  )
}

export default function ChatSplitLayout({ rooms, currentUserId, currentUserName, children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  // 로컬 방 목록 상태 — Realtime 업데이트를 반영
  const [localRooms, setLocalRooms] = useState<ChatRoomWithDetails[]>(rooms)

  // props 변경(레이아웃 재렌더) 시 동기화
  useEffect(() => {
    setLocalRooms(rooms)
  }, [rooms])

  const isRootPage = pathname === '/chats'
  const activeRoomId = !isRootPage && pathname.startsWith('/chats/')
    ? pathname.replace('/chats/', '')
    : undefined

  // activeRoomId를 ref로 유지 — Realtime 클로저에서 최신값 참조
  const activeRoomIdRef = useRef(activeRoomId)
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  // 방 진입 시 해당 방 unread_count 즉시 0으로 리셋
  useEffect(() => {
    if (!activeRoomId) return
    setLocalRooms((prev) =>
      prev.map((r) => (r.id === activeRoomId ? { ...r, unread_count: 0 } : r))
    )
  }, [activeRoomId])

  // Realtime INSERT 구독 — 미읽음 카운트 + last_message + 방 순서 실시간 갱신
  useEffect(() => {
    const supabase = createClient()
    const channelName = `chats-list:${currentUserId}:${Math.random().toString(36).slice(2, 9)}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const msg = payload.new as ChatMessage

          setLocalRooms((prev) => {
            const targetRoom = prev.find((r) => r.id === msg.room_id)
            if (!targetRoom) return prev

            const isActive = msg.room_id === activeRoomIdRef.current
            // 내 메시지거나 현재 보고 있는 방이면 unread 증가 안 함
            const delta = (msg.sender_id === currentUserId || isActive) ? 0 : 1

            const updated = prev.map((r) => {
              if (r.id !== msg.room_id) return r
              return {
                ...r,
                last_message: msg as ChatRoomWithDetails['last_message'],
                unread_count: (r.unread_count ?? 0) + delta,
              }
            })

            // 최신 메시지 방을 맨 위로 정렬
            return [...updated].sort((a, b) => {
              const aTime = a.last_message?.created_at ?? a.created_at
              const bTime = b.last_message?.created_at ?? b.created_at
              return new Date(bTime).getTime() - new Date(aTime).getTime()
            })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId]) // activeRoomId는 deps 제외 — ref로 처리

  // 검색 필터 (localRooms 기반)
  const filteredRooms = searchQuery.trim()
    ? localRooms.filter((room) => {
        const isManager = currentUserId === room.manager_id
        const opponent = isManager ? room.driver : room.manager
        const q = searchQuery.toLowerCase()
        return (
          opponent?.name?.toLowerCase().includes(q) ||
          room.last_message?.message?.toLowerCase().includes(q) ||
          room.jobs?.title?.toLowerCase().includes(q)
        )
      })
    : localRooms

  return (
    <>
      {/* ── 데스크톱: 좌우 2분할 (md 이상) ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-white">

        {/* 좌측 목록 패널 */}
        <div className="w-[360px] shrink-0 flex flex-col h-full border-r border-gray-200 bg-white">
          {/* 헤더: 뒤로가기 + 내 계정명 */}
          <div className="flex items-center gap-1 px-3 pt-5 pb-3 border-b border-gray-100">
            <button
              onClick={() => router.push('/mypage/applications')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
              aria-label="뒤로가기"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[17px] font-black text-slate-900 tracking-tight">{currentUserName}</span>
          </div>

          {/* 검색 인풋 */}
          <div className="px-4 py-2.5 border-b border-gray-100">
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

          {/* 방 목록 — 스크롤 격리 */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <DesktopRoomList rooms={filteredRooms} currentUserId={currentUserId} activeRoomId={activeRoomId} />
          </div>
        </div>

        {/* 우측 채팅 패널 — 스크롤 격리 */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {isRootPage ? <EmptyState /> : children}
        </div>
      </div>

      {/* ── 모바일: 단일 뷰 (md 미만) ── */}
      <div className="md:hidden">
        {isRootPage
          ? <ChatList rooms={localRooms} currentUserId={currentUserId} currentUserName={currentUserName} />
          : children
        }
      </div>
    </>
  )
}
