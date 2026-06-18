'use client'

// JobForm submit 로직 훅
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { EquipmentCode, JobType, PayDueType, WorkDuration } from '@/types'
import { MAX_PAY_AMOUNT } from '@/lib/constants'

export interface FormState {
  title: string
  job_type: JobType | ''
  equipment_codes: EquipmentCode[]
  payments: Partial<Record<EquipmentCode, { amount: string; days: string }>>
  description: string
  attachments: string
  caution: string
  location: string
  latitude: number | null
  longitude: number | null
  work_date: string
  work_duration: WorkDuration | ''
  pay_due_type: PayDueType | ''
}

export const INITIAL_FORM: FormState = {
  title: '',
  job_type: '',
  equipment_codes: [],
  payments: {},
  description: '',
  attachments: '',
  caution: '',
  location: '',
  latitude: null,
  longitude: null,
  work_date: '',
  work_duration: '',
  pay_due_type: '',
}

interface UseJobFormOptions {
  mode?: 'create' | 'edit'
  jobId?: string
  initialValues?: Partial<FormState>
}

export function useJobForm({ mode = 'create', jobId, initialValues }: UseJobFormOptions = {}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(
    initialValues ? { ...INITIAL_FORM, ...initialValues } : INITIAL_FORM,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = (key: keyof FormState, value: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleEquipment = (code: EquipmentCode) =>
    setForm((f) => {
      if (f.equipment_codes.includes(code)) {
        const { [code]: _r, ...rest } = f.payments // eslint-disable-line @typescript-eslint/no-unused-vars
        return { ...f, equipment_codes: f.equipment_codes.filter((c) => c !== code), payments: rest }
      }
      return { ...f, equipment_codes: [...f.equipment_codes, code], payments: { ...f.payments, [code]: { amount: '', days: '' } } }
    })

  const setPayment = (code: EquipmentCode, field: 'amount' | 'days', value: string) =>
    setForm((f) => ({
      ...f,
      payments: {
        ...f.payments,
        [code]: {
          ...f.payments[code],
          [field]: field === 'amount' ? formatPayAmount(value) : value.replace(/[^0-9]/g, ''),
        },
      },
    }))

  const allAmountsFilled =
    form.equipment_codes.length > 0 &&
    form.equipment_codes.every((code) => Boolean(form.payments[code]?.amount))

  const isValid = Boolean(
    form.title.trim() &&
    form.job_type &&
    form.equipment_codes.length > 0 &&
    allAmountsFilled &&
    form.description.trim() &&
    form.location &&
    form.latitude !== null &&
    form.work_date &&
    form.pay_due_type,
  )

  function formatPayAmount(v: string) {
    const num = v.replace(/[^0-9]/g, '')
    return num ? parseInt(num, 10).toLocaleString() : ''
  }

  async function handleSubmit() {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    const payload = {
      title: form.title.trim(),
      job_type: form.job_type,
      equipment_codes: form.equipment_codes,
      description: form.description.trim(),
      attachments: form.attachments.trim() || null,
      caution: form.caution.trim() || null,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      pay_amounts: Object.fromEntries(
        form.equipment_codes.map((code) => {
          const parsed = parseInt((form.payments[code]?.amount ?? '0').replace(/,/g, ''), 10)
          return [code, Math.min(parsed, MAX_PAY_AMOUNT)]
        }),
      ),
      work_days: Object.fromEntries(
        form.equipment_codes.map((code) => [code, parseInt(form.payments[code]?.days ?? '0', 10)]),
      ),
      work_date: form.work_date,
      work_duration: form.work_duration || null,
      pay_due_type: form.pay_due_type,
    }
    try {
      const res = await fetch(mode === 'edit' ? `/api/jobs/${jobId}` : '/api/jobs', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? (mode === 'edit' ? '수정 실패' : '등록 실패'))
      }
      toast.success(mode === 'edit' ? '일감이 수정되었습니다.' : '일감이 등록되었습니다.')
      router.push(mode === 'edit' ? `/jobs/${jobId}` : '/jobs')
      router.refresh()
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : mode === 'edit'
            ? '일감 수정에 실패했습니다.'
            : '일감 등록에 실패했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return { form, set, toggleEquipment, setPayment, isValid, isSubmitting, handleSubmit, formatPayAmount }
}
