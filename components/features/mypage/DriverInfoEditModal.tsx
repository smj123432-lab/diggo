'use client'

// 기사 정보 수정 모달 — 현장 경력 + 보유 장비 + 서류 등록
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, EQUIPMENT_CODES_LIST } from '@/types'

type CertStatus = 'idle' | 'uploading' | 'done'

interface Updates {
  experience_years: number | null
  equipments: { id: string; model_code: EquipmentCode }[]
}

interface Props {
  experienceYears: number | null
  equipmentCodes: EquipmentCode[]
  onClose: () => void
  onSaved: (updates: Updates) => void
}

export function DriverInfoEditModal({ experienceYears, equipmentCodes, onClose, onSaved }: Props) {
  const [years, setYears] = useState(experienceYears?.toString() ?? '')
  const [selectedCodes, setSelectedCodes] = useState<EquipmentCode[]>(equipmentCodes)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const [licenseStatus, setLicenseStatus] = useState<CertStatus>('idle')
  const [safetyStatus, setSafetyStatus] = useState<CertStatus>('idle')
  const licenseRef = useRef<HTMLInputElement>(null)
  const safetyRef = useRef<HTMLInputElement>(null)

  function toggleCode(code: EquipmentCode) {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  async function uploadCert(file: File, certType: 'license' | 'safety_education', setStatus: (s: CertStatus) => void) {
    setStatus('uploading')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('cert_type', certType)
      const res = await fetch('/api/certifications', { method: 'POST', body })
      if (!res.ok) throw new Error((await res.json()).error ?? '업로드 실패')
      setStatus('done')
      toast.success('서류가 제출되었습니다. 검토 후 인증 처리됩니다.')
      router.refresh()
    } catch (e) {
      setStatus('idle')
      toast.error(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const parsedYears = years.trim() === '' ? null : parseInt(years, 10)
      if (years.trim() !== '' && (isNaN(parsedYears!) || parsedYears! < 0)) {
        toast.error('경력은 0 이상의 숫자로 입력해 주세요.')
        return
      }

      // 순차 처리: 첫 번째 실패 시 두 번째 요청을 보내지 않아 부분 저장 방지
      const profileRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experience_years: parsedYears }),
      })
      if (!profileRes.ok) throw new Error((await profileRes.json()).error ?? '저장 실패')

      const equipRes = await fetch('/api/equipments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: selectedCodes }),
      })
      if (!equipRes.ok) throw new Error((await equipRes.json()).error ?? '장비 저장 실패')

      toast.success('기사 정보가 저장되었습니다.')
      onSaved({
        experience_years: parsedYears,
        equipments: selectedCodes.map((model_code, i) => ({ id: `tmp-${i}`, model_code })),
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-bold text-gray-900">기사 정보 수정</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 바디 */}
        <div className="px-6 py-5 space-y-5">

          {/* 현장 경력 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">현장 경력 (년)</label>
            <input
              type="number"
              min={0}
              max={60}
              value={years}
              onChange={e => setYears(e.target.value)}
              placeholder="예: 10"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          {/* 보유 장비 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">보유 장비</label>
            <div className="grid grid-cols-4 gap-2">
              {EQUIPMENT_CODES_LIST.map(code => {
                const active = selectedCodes.includes(code)
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleCode(code)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {EQUIPMENT_LABELS[code]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 서류 등록 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">서류 등록</label>
            <p className="text-xs text-gray-400 mb-2.5">검토 후 인증 처리됩니다 (영업일 1~2일)</p>
            <div className="space-y-2">

              {/* 면허증 */}
              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="9" cy="10" r="2" />
                      <path d="M15 8h2M15 12h2M7 16h10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">면허증</span>
                </div>
                <input
                  ref={licenseRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) uploadCert(file, 'license', setLicenseStatus)
                    e.target.value = ''
                  }}
                />
                {licenseStatus === 'done' ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    제출완료
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => licenseRef.current?.click()}
                    disabled={licenseStatus === 'uploading'}
                    className="text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {licenseStatus === 'uploading' ? '업로드 중...' : '파일 선택'}
                  </button>
                )}
              </div>

              {/* 이수증 */}
              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">안전교육 이수증</span>
                </div>
                <input
                  ref={safetyRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) uploadCert(file, 'safety_education', setSafetyStatus)
                    e.target.value = ''
                  }}
                />
                {safetyStatus === 'done' ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    제출완료
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => safetyRef.current?.click()}
                    disabled={safetyStatus === 'uploading'}
                    className="text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {safetyStatus === 'uploading' ? '업로드 중...' : '파일 선택'}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {isSaving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
