'use client'

// 채팅 하단 입력창 — 텍스트 전송 + 이미지 첨부 버튼 분기
import { useRef } from 'react'

interface ChatInputProps {
  input: string
  isSending: boolean
  isUploading: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ChatInput({
  input,
  isSending,
  isUploading,
  textareaRef,
  fileInputRef,
  onChange,
  onKeyDown,
  onSend,
  onImageSelect,
}: ChatInputProps) {
  return (
    <footer className="bg-white border-t border-gray-100 shrink-0">
      <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center gap-2">

        <div className="flex-1 flex items-center border border-gray-200 rounded-full px-4 py-2 bg-white focus-within:border-gray-400 transition-colors min-h-[40px]">
          <label htmlFor="chat-message-input" className="sr-only">메시지 입력</label>
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="메시지 보내기..."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-800 placeholder-gray-400 max-h-24 overflow-y-auto leading-relaxed"
            style={{ minHeight: '22px' }}
          />
        </div>

        {input.trim() ? (
          <button
            onClick={onSend}
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageSelect}
      />
    </footer>
  )
}
