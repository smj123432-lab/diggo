// components/features/ledger/AddExpenseModal.tsx
// 지출 추가 모달 — createPortal(document.body) 패턴
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { LEDGER_EXPENSE_CATEGORIES } from '@/types'

interface AddExpenseModalProps {
  defaultDate?: string // YYYY-MM-DD
  year: number
  month: number
  onClose: () => void
  onSaved: () => void
}

const today = new Date().toISOString().split('T')[0]

export function AddExpenseModal({
  defaultDate,
  year,
  month,
  onClose,
  onSaved,
}: AddExpenseModalProps) {
  const [date, setDate] = useState(defaultDate ?? today)
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) {
      toast.error('카테고리를 선택해주세요.')
      return
    }
    const parsedAmount = parseInt(amount.replace(/,/g, ''), 10)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('금액을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/ledger/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_date: date,
          category,
          memo: memo || null,
          amount: parsedAmount,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('지출이 등록되었습니다.')
      onSaved()
      onClose()
    } catch {
      toast.error('지출 등록에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-900">지출 추가</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">날짜</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">카테고리</label>
            <div className="flex flex-wrap gap-1.5">
              {LEDGER_EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    category === cat
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">금액 (원)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min={1}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">메모 (선택)</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: OO 주유소"
              maxLength={100}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
