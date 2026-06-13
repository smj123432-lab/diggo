'use client'

// 실시간 채팅방 — Supabase Realtime 구독 + 낙관적 업데이트 + 이미지 전송
// 기능: 메시지 읽음 처리, 메시지 삭제, 채팅방 나가기
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ChatRoomWithDetails, ApplicationStatus } from '@/types'

const IMG_PREFIX = '[img]'

// 같은 발신자 + 같은 분(minute) 단위면 연속 그룹으로 판단
function isSameGroup(a: ChatMessage | null | undefined, b: ChatMessage | null | undefined): boolean {
  if (!a || !b) return false
  if (a.sender_id !== b.sender_id) return false
  return a.created_at.slice(0, 16) === b.created_at.slice(0, 16)
}

// 발신자·위치(solo/first/middle/last)에 따라 말풍선 모서리 클래스 반환
function getBubbleRadius(isMine: boolean, isPrevSame: boolean, isNextSame: boolean): string {
  if (isMine) {
    if (!isPrevSame && !isNextSame) return 'rounded-2xl rounded-br-sm'                  // 단독
    if (!isPrevSame && isNextSame)  return 'rounded-2xl rounded-br-[5px]'               // 첫 번째
    if (isPrevSame  && isNextSame)  return 'rounded-l-2xl rounded-r-[5px]'              // 중간
    return 'rounded-l-2xl rounded-tr-[5px] rounded-br-sm'                              // 마지막
  } else {
    if (!isPrevSame && !isNextSame) return 'rounded-2xl rounded-bl-sm'                  // 단독
    if (!isPrevSame && isNextSame)  return 'rounded-2xl rounded-bl-[5px]'               // 첫 번째
    if (isPrevSame  && isNextSame)  return 'rounded-r-2xl rounded-l-[5px]'              // 중간
    return 'rounded-r-2xl rounded-tl-[5px] rounded-bl-sm'                              // 마지막
  }
}

interface Props {
  room: ChatRoomWithDetails
  initialMessages: ChatMessage[]
  currentUserId: string
  initialApplicationStatus: ApplicationStatus | null
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // 상대방 메시지라면 즉시 읽음 처리
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
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updated = payload.new as ChatMessage
          // REPLICA IDENTITY DEFAULT 환경에서 payload.new는 PK(id)와 변경된 컬럼만 포함
          // room_id가 payload에 없을 수 있으므로 메시지 존재 여부로 귀속 판단
          setMessages((prev) => {
            if (!prev.some((m) => m.id === updated.id)) return prev
            return prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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

          {/* 뒤로가기 — 모바일 전용: 채팅 목록으로 이동 */}
          <button
            onClick={() => router.push('/chats')}
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

          {/* 메뉴 버튼 + 드롭다운 */}
          <div className="relative shrink-0">
            <button
              ref={menuBtnRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="메뉴"
              disabled={isDispatching || isLeaving}
            >
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
              </svg>
            </button>

            {/* 드롭다운 */}
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
              >
                {isManager ? (
                  <>
                    {appStatus === 'accepted' ? (
                      <div className="px-4 py-3 text-sm text-emerald-600 font-semibold bg-emerald-50">
                        ✓ 이미 수락한 기사입니다
                      </div>
                    ) : appStatus === 'rejected' ? (
                      <div className="px-4 py-3 text-sm text-gray-400 font-semibold bg-gray-50">
                        거절된 기사입니다
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDispatch('accept')}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          배치 수락
                        </button>
                        <button
                          onClick={() => handleDispatch('reject')}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors border-t border-gray-100"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                          배치 거절
                        </button>
                      </>
                    )}
                    <Link
                      href={`/profiles/${room.driver_id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      기사 프로필 보기
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/jobs/${room.job_id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
                      </svg>
                      게시물 확인
                    </Link>
                    <Link
                      href={`/profiles/${room.manager_id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      소장 프로필 보기
                    </Link>
                  </>
                )}

                {/* 공통: 채팅방 나가기 */}
                <button
                  onClick={() => { setMenuOpen(false); setShowLeaveConfirm(true) }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  채팅방 나가기
                </button>
              </div>
            )}
          </div>
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
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === currentUserId
              const isTemp = msg.id.startsWith('temp-')
              const isImg = msg.message.startsWith(IMG_PREFIX)
              const isDeletedMsg = msg.is_deleted

              const prevMsg = index > 0 ? messages[index - 1] : null
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null
              const isPrevSame = isSameGroup(prevMsg, msg)
              const isNextSame = isSameGroup(msg, nextMsg)

              const marginTop = index === 0 ? '' : isPrevSame ? 'mt-0.5' : 'mt-2.5'
              const showAvatar = !isMine && !isNextSame
              const showTime = !isNextSame
              const bubbleRadius = isImg ? 'rounded-2xl' : getBubbleRadius(isMine, isPrevSame, isNextSame)

              if (isMine) {
                // ── 내 메시지: justify-end + 일반 row 순서
                // 시각 순서: [FREE SPACE] [1+시간] [말풍선] [삭제버튼(hover)]
                // flex-row-reverse 제거 → 삭제버튼이 타임스탬프와 말풍선 사이에 끼는 버그 해소
                return (
                  <div key={msg.id} className={`flex items-end justify-end gap-1.5 ${marginTop}`}>

                    {/* [안 읽음 1 + 시간] — 말풍선 왼쪽 바로 옆 밀착
                        삭제된 메시지는 is_read 여부와 무관하게 1 표시 안 함 */}
                    {(showTime || (!msg.is_read && !isTemp && !isDeletedMsg)) && (
                      <div className="flex flex-col items-end justify-end select-none shrink-0 pb-0.5 gap-0.5">
                        {!msg.is_read && !isTemp && !isDeletedMsg && (
                          <span className="text-[10px] font-bold text-yellow-400 leading-none">1</span>
                        )}
                        {showTime && (
                          <span className="text-[10px] text-gray-400 leading-tight">
                            {isTemp ? '전송중' : formatTime(msg.created_at)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 말풍선 */}
                    <div className="max-w-[70%] min-w-0">
                      <div className={`min-w-[50px] ${isTemp ? 'opacity-60' : ''} ${
                        isDeletedMsg
                          ? `px-3.5 py-2.5 text-sm italic whitespace-pre-wrap break-words ${bubbleRadius} bg-gray-100 text-gray-400`
                          : isImg
                            ? `overflow-hidden ${bubbleRadius}`
                            : `px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${bubbleRadius} bg-blue-500 text-white`
                      }`}>
                        {isDeletedMsg
                          ? '삭제된 메시지입니다.'
                          : isImg
                            ? <img src={msg.message.slice(IMG_PREFIX.length)} alt="이미지" className="max-w-full max-h-56 object-cover block" loading="lazy" />
                            : msg.message
                        }
                      </div>
                    </div>
                  </div>
                )
              }

              // ── 상대방 메시지: 기존 구조 유지
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${marginTop}`}>
                  {showAvatar ? (
                    <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden ring-1 ring-gray-200 self-end mb-0.5">
                      {opponent?.avatar_url ? (
                        <img src={opponent.avatar_url} alt={opponent.name ?? ''} className="w-full h-full object-cover" />
                      ) : (
                        <DefaultAvatar size={28} />
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0 w-7" />
                  )}

                  <div className="flex items-end gap-1.5 max-w-[70%] min-w-0">
                    <div className={`min-w-[50px] ${
                      isDeletedMsg
                        ? `px-3.5 py-2.5 text-sm italic whitespace-pre-wrap break-words ${bubbleRadius} bg-gray-100 text-gray-400`
                        : isImg
                          ? `overflow-hidden ${bubbleRadius}`
                          : `px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${bubbleRadius} bg-gray-100 text-slate-800`
                    }`}>
                      {isDeletedMsg
                        ? '삭제된 메시지입니다.'
                        : isImg
                          ? <img src={msg.message.slice(IMG_PREFIX.length)} alt="이미지" className="max-w-full max-h-56 object-cover block" loading="lazy" />
                          : msg.message
                      }
                    </div>
                  </div>

                  {showTime && (
                    <div className="flex flex-col items-start justify-end shrink-0 pb-0.5">
                      <span className="text-[10px] text-gray-400 leading-tight">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      {/* ── 하단 입력창 ── */}
      <footer className="bg-white border-t border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center gap-2">

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

          {/* 우측: 텍스트 있으면 전송, 없으면 이미지 버튼 */}
          {input.trim() ? (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="shrink-0 text-blue-500 font-bold text-sm disabled:opacity-40 hover:text-blue-600 transition-colors px-1"
            >
              전송
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
              aria-label="이미지 첨부"
            >
              {isUploading ? (
                <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </button>
          )}
        </div>
      </footer>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
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
