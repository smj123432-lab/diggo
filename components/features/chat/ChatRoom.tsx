'use client'

// 실시간 채팅방 — Supabase Realtime 구독 + 낙관적 업데이트
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ChatRoomWithDetails } from '@/types'

interface Props {
  room: ChatRoomWithDetails
  initialMessages: ChatMessage[]
  currentUserId: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const period = h < 12 ? '오전' : '오후'
  return `${period} ${h % 12 === 0 ? 12 : h % 12}:${m}`
}

function DefaultAvatar({ size }: { size: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gray-200"
      style={{ width: size, height: size }}
    >
      <svg className="text-gray-400" style={{ width: size * 0.55, height: size * 0.55 }} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  )
}

export default function ChatRoom({ room, initialMessages, currentUserId }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const opponent = currentUserId === room.manager_id ? room.driver : room.manager
  const jobInfo = room.jobs
  const dateStr = jobInfo?.work_date
    ? new Date(jobInfo.work_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : ''

  // 스크롤 최하단 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime 구독 — 채널 이름에 고유값 추가로 React Strict Mode 이중 실행 시 충돌 방지
  useEffect(() => {
    const supabase = createClient()
    // 같은 room.id로 채널이 재생성될 때 Supabase 내부 캐시 충돌을 막기 위해 고유 suffix 사용
    const channel = supabase
      .channel(`room:${room.id}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            // 이미 존재하는 메시지(실제 ID 중복) 방지
            if (prev.some((msg) => msg.id === payload.new.id)) return prev
            return [...prev, payload.new as ChatMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending) return

    setInput('')
    setIsSending(true)

    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId, room_id: room.id, sender_id: currentUserId,
      message: text, is_read: false, created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch(`/api/chats/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const json = await res.json() as { data?: ChatMessage; error?: string }
      if (!res.ok) throw new Error(json.error ?? '전송 실패')
      setMessages((prev) => prev.map((m) => (m.id === tempId ? json.data! : m)))
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error('메시지 전송에 실패했습니다.')
      setInput(text)
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [input, isSending, room.id, currentUserId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-screen md:h-full bg-white">

      {/* ── 상단 헤더 ── */}
      <header className="bg-white border-b border-gray-100 shrink-0 z-10">
        <div className="px-3 py-2.5 flex items-center gap-2.5">

          {/* 뒤로가기 — 모바일 전용 */}
          <button
            onClick={() => router.back()}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            aria-label="뒤로가기"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 상대방 아바타 */}
          <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden ring-1 ring-gray-200">
            {opponent?.avatar_url ? (
              <img src={opponent.avatar_url} alt={opponent.name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatar size={36} />
            )}
          </div>

          {/* 이름 + 일감 정보 */}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-slate-900 leading-tight truncate">
              {opponent?.name ?? '상대방'}
            </p>
            {jobInfo && (
              <p className="text-[11px] text-gray-400 leading-tight truncate mt-0.5">
                {jobInfo.title}{dateStr && ` · ${dateStr}`}
              </p>
            )}
          </div>

          {/* 액션 아이콘 — 데스크톱 전용 */}
          <div className="hidden md:flex items-center gap-0.5 shrink-0">
            {/* 전화 */}
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="전화">
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* 영상통화 */}
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="영상통화">
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
            {/* 상세정보 */}
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="상세정보">
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeWidth={2.5} />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── 메시지 영역 — 스크롤 격리 ── */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="max-w-2xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
              <p className="text-3xl">💬</p>
              <p className="text-sm text-gray-400">첫 메시지를 보내보세요.</p>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId
              const isTemp = msg.id.startsWith('temp-')
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-slate-800 rounded-bl-sm'
                  } ${isTemp ? 'opacity-60' : ''}`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 pb-0.5">
                    {isTemp ? '전송중' : formatTime(msg.created_at)}
                  </span>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      {/* ── 하단 입력창 — 인스타 DM 알약 스타일 ── */}
      <footer className="bg-white border-t border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center gap-2">

          {/* 이모지 아이콘 */}
          <button
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="이모지"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 13s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeWidth={2.5} />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeWidth={2.5} />
            </svg>
          </button>

          {/* 알약 입력 컨테이너 */}
          <div className="flex-1 flex items-center border border-gray-200 rounded-full px-4 py-2 bg-white focus-within:border-gray-400 transition-colors min-h-[40px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지 보내기..."
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-800 placeholder-gray-400 max-h-24 overflow-y-auto leading-relaxed"
              style={{ minHeight: '22px' }}
            />
          </div>

          {/* 우측 아이콘: 텍스트 없으면 이미지+마이크, 있으면 전송 */}
          {input.trim() ? (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="shrink-0 text-blue-500 font-bold text-sm disabled:opacity-40 hover:text-blue-600 transition-colors px-1"
            >
              전송
            </button>
          ) : (
            <div className="flex items-center gap-0.5 shrink-0">
              {/* 이미지 첨부 */}
              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" aria-label="이미지 첨부">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              {/* 마이크 */}
              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" aria-label="음성 메시지">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
                  <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
                  <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
