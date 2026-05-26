'use client'

// 일감 삭제 확인 모달 — 텍스트 입력 기반 실수 방지
// Esc 닫기 + 포커스 복원 지원
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}

export function DeleteJobModal({ onConfirm, onClose, isLoading }: Props) {
  const [input, setInput] = useState('')
  const canDelete = input === '삭제'
  const isWrong = input.length > 0 && input !== '삭제'

  // 모달 열기 전 포커스 요소 저장 → 닫힐 때 복원
  const prevFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement
    return () => {
      prevFocusRef.current?.focus()
    }
  }, [])

  // Esc 키로 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, isLoading])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 딤 배경 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 모달 본체 */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5">

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 경고 헤더 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <h2 className="text-base font-bold text-gray-900">일감을 완전히 삭제하시겠습니까?</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            삭제된 일감은 소장님의 지출 내역 장부 및 달력에서<br />
            <span className="text-red-500 font-semibold">영구히 삭제되며 복구할 수 없습니다.</span>
          </p>
        </div>

        {/* 입력 확인 */}
        <div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="삭제"
            className={`w-full px-4 py-3 border rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition ${
              isWrong
                ? 'border-red-300 focus:ring-red-400'
                : 'border-gray-200 focus:ring-red-400'
            }`}
          />
          {/* 잘못 입력했을 때만 경고 표시 */}
          {isWrong && (
            <p className="text-xs text-red-400 mt-1.5 pl-1">
              <span className="font-bold">"삭제"</span>라고 정확히 입력해 주세요.
            </p>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={!canDelete || isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
              canDelete && !isLoading
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? '삭제 중...' : '진짜 삭제하기'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
