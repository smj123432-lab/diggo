'use client'

// 장부 TanStack Query 훅 — 월별 조회, 지출 추가/삭제
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LedgerMonthData } from '@/types'

async function fetchLedgerMonthly(year: number, month: number): Promise<LedgerMonthData> {
  const res = await fetch(`/api/ledger/monthly?year=${year}&month=${month}`)
  if (!res.ok) throw new Error('장부를 불러오지 못했습니다.')
  const json = await res.json()
  return json.data as LedgerMonthData
}

async function postExpense(body: {
  expense_date: string
  category: string
  memo: string | null
  amount: number
}) {
  const res = await fetch('/api/ledger/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('지출 등록에 실패했습니다.')
  return res.json()
}

async function deleteExpense(id: string) {
  const res = await fetch(`/api/ledger/expenses/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('지출 삭제에 실패했습니다.')
}

export function useLedger(year: number, month: number) {
  return useQuery({
    queryKey: ['ledger', year, month],
    queryFn: () => fetchLedgerMonthly(year, month),
    staleTime: 0,
  })
}

export function useAddExpense(year: number, month: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger', year, month] })
    },
  })
}

export function useDeleteExpense(year: number, month: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger', year, month] })
    },
  })
}
