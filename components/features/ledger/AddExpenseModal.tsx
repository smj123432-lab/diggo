// components/features/ledger/AddExpenseModal.tsx
// 내역 추가 모달 — 수입/지출 탭 선택 + createPortal(document.body) 패턴
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

type EntryType = 'income' | 'expense'

export function AddExpenseModal({
  defaultDate,
  year,
  month,
  onClose,
  onSaved,
}: AddExpenseModalProps) {
  const [entryType, setEntryType] = useState<EntryType>('expense')
  const [date, setDate] = useState(defaultDate ?? today)
  const [category, setCategory] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('') // 화면에 표시되는 콤마 포맷 문자열
  const [memo, setMemo] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // 탭 전환 시 카테고리 초기화
  function handleTypeChange(type: EntryType) {
    setEntryType(type)
    setCategory('')
  }

  // 금액 입력 — 숫자만 추출 후 콤마 포맷 적용
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    setAmountDisplay(digits ? Number(digits).toLocaleString('ko-KR') : '')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (entryType === 'expense' && !category) {
      toast.error('카테고리를 선택해주세요.')
      return
    }
    const parsedAmount = parseInt(amountDisplay.replace(/,/g, ''), 10)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('금액을 입력해주세요.')
      return
    }

    // 수입은 category='수입', 지출은 선택한 카테고리로 저장
    const finalCategory = entryType === 'income' ? '수입' : category

    setIsSaving(true)
    try {
      const res = await fetch('/api/ledger/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_date: date,
          category: finalCategory,
          memo: memo || null,
          amount: parsedAmount,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(entryType === 'income' ? '수입이 등록되었습니다.' : '지출이 등록되었습니다.')
      onSaved()
      onClose()
    } catch {
      toast.error('등록에 실패했습니다.')
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
        <h2 className="text-base font-bold text-gray-900">내역 추가</h2>

        {/* 수입 / 지출 탭 */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${
              entryType === 'expense'
                ? 'bg-white text-red-500 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            지출
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${
              entryType === 'income'
                ? 'bg-white text-blue-500 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            수입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 날짜 */}
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

          {/* 카테고리 (지출만) */}
          {entryType === 'expense' && (
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
          )}

          {/* 금액 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">금액 (원)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder="0"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">메모 (선택)</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={entryType === 'income' ? '예: OO 건설 선급금' : '예: OO 주유소'}
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
              className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 ${
                entryType === 'income' ? 'bg-blue-500' : 'bg-blue-500'
              }`}
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
