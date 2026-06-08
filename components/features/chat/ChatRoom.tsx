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

export default function ChatRoom({ room, initialMessages, currentUserId }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const opponent = currentUserId === room.manager_id ? room.driver : room.manager

  // 스크롤 최하단 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime 구독
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          // 낙관적 업데이트로 이미 추가된 내 메시지는 skip
          if (newMsg.sender_id === currentUserId) return
          setMessages((prev) => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, currentUserId])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending) return

    // 1. 입력창 즉시 초기화
    setInput('')
    setIsSending(true)

    // 2. 낙관적 업데이트 (임시 ID)
    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId,
      room_id: room.id,
      sender_id: currentUserId,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
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

      // 3. 임시 ID → 실제 서버 ID로 치환
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? json.data! : m))
      )
    } catch {
      // 4. 실패 시 임시 메시지 제거
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error('메시지 전송에 실패했습니다.')
      setInput(text)
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [input, isSending, room.id, currentUserId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const jobInfo = room.jobs
  const dateStr = jobInfo?.work_date
    ? new Date(jobInfo.work_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : ''

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            aria-label="뒤로가기"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {opponent?.name ?? '상대방'}
            </p>
            {jobInfo && (
              <p className="text-xs text-gray-400 truncate">
                {jobInfo.title} {dateStr && `· ${dateStr}`}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* 메시지 영역 */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-3xl">💬</p>
            <p className="text-sm text-gray-400">첫 메시지를 보내보세요.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId
            const isTemp = msg.id.startsWith('temp-')
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* 말풍선 */}
                <div
                  className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-slate-800 rounded-bl-sm'
                  } ${isTemp ? 'opacity-70' : ''}`}
                >
                  {msg.message}
                </div>
                {/* 시간 */}
                <span className="text-[10px] text-gray-400 shrink-0 pb-0.5">
                  {isTemp ? '전송중' : formatTime(msg.created_at)}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* 하단 입력창 */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:bg-white transition-colors max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  )
}
