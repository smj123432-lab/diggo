'use client'

// 실시간 채팅방 — Supabase Realtime 구독 + 낙관적 업데이트 + 이미지 전송
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ChatRoomMenu } from './ChatRoomMenu'
import { ChatMessageBubble } from './ChatMessageBubble'
import { ChatInput } from './ChatInput'
import type { ChatMessage, ChatRoomWithDetails, ApplicationStatus } from '@/types'

const IMG_PREFIX = '[img]'

interface Props {
  room: ChatRoomWithDetails
  initialMessages: ChatMessage[]
  currentUserId: string
  initialApplicationStatus: ApplicationStatus | null
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

export default function ChatRoom({ room, initialMessages, currentUserId, initialApplicationStatus }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDispatching, setIsDispatching] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(initialApplicationStatus)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const isManager = currentUserId === room.manager_id
  const opponent = isManager ? room.driver : room.manager
  const jobInfo = room.jobs
  const dateStr = jobInfo?.work_date
    ? new Date(jobInfo.work_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : ''

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuBtnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 소장: 배치 수락/거절 처리
  const handleDispatch = async (action: 'accept' | 'reject') => {
    setMenuOpen(false)
    setIsDispatching(true)
    try {
      const res = await fetch(`/api/chats/${room.id}/dispatch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? '처리 실패')
      setAppStatus(action === 'accept' ? 'accepted' : 'rejected')
      toast.success(action === 'accept' ? '배치를 수락했습니다.' : '배치를 거절했습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setIsDispatching(false)
    }
  }

  // 채팅방 나가기
  const handleLeave = async () => {
    setShowLeaveConfirm(false)
    setIsLeaving(true)
    try {
      const res = await fetch(`/api/chats/${room.id}/leave`, { method: 'POST' })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? '나가기 실패')
      toast.success('채팅방을 나갔습니다.')
      router.replace('/chats')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '채팅방 나가기에 실패했습니다.')
      setIsLeaving(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime 구독 — INSERT(새 메시지 + 즉시 읽음 처리) + UPDATE(삭제/읽음 반영)
  useEffect(() => {
    const supabase = createClient()
    const channelName = `room:${room.id}:${Math.random().toString(36).slice(2, 9)}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (newMsg.sender_id !== currentUserId) {
            await supabase
              .from('chat_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const updated = payload.new as ChatMessage
          setMessages((prev) => {
            if (!prev.some((m) => m.id === updated.id)) return prev
            return prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room.id, currentUserId])

  // 메시지 API 전송 공용 헬퍼
  const postMessage = useCallback(async (message: string): Promise<ChatMessage> => {
    const res = await fetch(`/api/chats/${room.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    const json = await res.json() as { data?: ChatMessage; error?: string }
    if (!res.ok) throw new Error(json.error ?? '전송 실패')
    return json.data!
  }, [room.id])

  // 텍스트 전송 (낙관적 업데이트)
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending) return

    setInput('')
    setIsSending(true)

    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId, room_id: room.id, sender_id: currentUserId,
      message: text, is_read: false, is_deleted: false, created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const saved = await postMessage(text)
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)))
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error('메시지 전송에 실패했습니다.')
      setInput(text)
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [input, isSending, room.id, currentUserId, postMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // 이미지 선택 → Storage 업로드 → 메시지 전송
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 전송할 수 있습니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하의 이미지만 전송할 수 있습니다.')
      return
    }

    setIsUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${room.id}/${Date.now()}.${ext}`

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(uploadData.path)

      const saved = await postMessage(`${IMG_PREFIX}${publicUrl}`)
      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev
        return [...prev, saved]
      })
    } catch {
      toast.error('이미지 전송에 실패했습니다.')
    } finally {
      setIsUploading(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-screen md:h-full bg-white">

      {/* ── 상단 헤더 ── */}
      <header className="bg-white border-b border-gray-100 shrink-0 z-10">
        <div className="px-3 py-2.5 flex items-center gap-2.5">

          <button
            onClick={() => router.push('/chats')}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            aria-label="뒤로가기"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden ring-1 ring-gray-200">
            {opponent?.avatar_url ? (
              <img src={opponent.avatar_url} alt={opponent.name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatar size={36} />
            )}
          </div>

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

          <ChatRoomMenu
            isManager={isManager}
            appStatus={appStatus}
            isDispatching={isDispatching}
            isLeaving={isLeaving}
            roomId={room.id}
            jobId={room.job_id}
            driverId={room.driver_id}
            managerId={room.manager_id}
            menuRef={menuRef}
            menuBtnRef={menuBtnRef}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((v) => !v)}
            onDispatch={handleDispatch}
            onLeaveRequest={() => setShowLeaveConfirm(true)}
          />
        </div>
      </header>

      {/* ── 메시지 영역 ── */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="max-w-2xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
              <p className="text-3xl">💬</p>
              <p className="text-sm text-gray-400">첫 메시지를 보내보세요.</p>
            </div>
          )}
          <div className="flex flex-col">
            {messages.map((msg, index) => (
              <ChatMessageBubble
                key={msg.id}
                msg={msg}
                index={index}
                messages={messages}
                currentUserId={currentUserId}
                opponentAvatarUrl={opponent?.avatar_url}
                opponentName={opponent?.name}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      {/* ── 하단 입력창 ── */}
      <ChatInput
        input={input}
        isSending={isSending}
        isUploading={isUploading}
        textareaRef={textareaRef}
        fileInputRef={fileInputRef}
        onChange={setInput}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        onImageSelect={handleImageSelect}
      />

      {/* 채팅방 나가기 확인 모달 */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl mx-4 p-6 max-w-xs w-full">
            <p className="text-[15px] font-bold text-slate-900 mb-1.5">채팅방 나가기</p>
            <p className="text-sm text-gray-500 mb-5">나가면 목록에서 삭제됩니다. 계속할까요?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLeave}
                disabled={isLeaving}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLeaving ? '처리중...' : '나가기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
