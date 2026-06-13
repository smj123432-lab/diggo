'use client'

// 채팅 메시지 버블 — 내 메시지(우측 파란색) / 상대방 메시지(좌측 회색) 분기 렌더링
import type { ChatMessage } from '@/types'

const IMG_PREFIX = '[img]'

function isSameGroup(a: ChatMessage | null | undefined, b: ChatMessage | null | undefined): boolean {
  if (!a || !b) return false
  if (a.sender_id !== b.sender_id) return false
  return a.created_at.slice(0, 16) === b.created_at.slice(0, 16)
}

function getBubbleRadius(isMine: boolean, isPrevSame: boolean, isNextSame: boolean): string {
  if (isMine) {
    if (!isPrevSame && !isNextSame) return 'rounded-2xl rounded-br-sm'
    if (!isPrevSame && isNextSame)  return 'rounded-2xl rounded-br-[5px]'
    if (isPrevSame  && isNextSame)  return 'rounded-l-2xl rounded-r-[5px]'
    return 'rounded-l-2xl rounded-tr-[5px] rounded-br-sm'
  } else {
    if (!isPrevSame && !isNextSame) return 'rounded-2xl rounded-bl-sm'
    if (!isPrevSame && isNextSame)  return 'rounded-2xl rounded-bl-[5px]'
    if (isPrevSame  && isNextSame)  return 'rounded-r-2xl rounded-l-[5px]'
    return 'rounded-r-2xl rounded-tl-[5px] rounded-bl-sm'
  }
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

interface ChatMessageBubbleProps {
  msg: ChatMessage
  index: number
  messages: ChatMessage[]
  currentUserId: string
  opponentAvatarUrl: string | null | undefined
  opponentName: string | null | undefined
}

export function ChatMessageBubble({
  msg,
  index,
  messages,
  currentUserId,
  opponentAvatarUrl,
  opponentName,
}: ChatMessageBubbleProps) {
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

  const bubbleClass = isDeletedMsg
    ? `px-3.5 py-2.5 text-sm italic whitespace-pre-wrap break-words ${bubbleRadius} bg-gray-100 text-gray-400`
    : isImg
      ? `overflow-hidden ${bubbleRadius}`
      : isMine
        ? `px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${bubbleRadius} bg-blue-500 text-white`
        : `px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${bubbleRadius} bg-gray-100 text-slate-800`

  const bubbleContent = isDeletedMsg
    ? '삭제된 메시지입니다.'
    : isImg
      ? <img src={msg.message.slice(IMG_PREFIX.length)} alt="이미지" className="max-w-full max-h-56 object-cover block" loading="lazy" />
      : msg.message

  if (isMine) {
    return (
      <div className={`flex items-end justify-end gap-1.5 ${marginTop}`}>
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
        <div className="max-w-[70%] min-w-0">
          <div className={`min-w-[50px] ${isTemp ? 'opacity-60' : ''} ${bubbleClass}`}>
            {bubbleContent}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 ${marginTop}`}>
      {showAvatar ? (
        <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden ring-1 ring-gray-200 self-end mb-0.5">
          {opponentAvatarUrl ? (
            <img src={opponentAvatarUrl} alt={opponentName ?? ''} className="w-full h-full object-cover" />
          ) : (
            <DefaultAvatar size={28} />
          )}
        </div>
      ) : (
        <div className="shrink-0 w-7" />
      )}

      <div className="flex items-end gap-1.5 max-w-[70%] min-w-0">
        <div className={`min-w-[50px] ${bubbleClass}`}>
          {bubbleContent}
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
}
