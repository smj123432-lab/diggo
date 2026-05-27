'use client'

// 기사 정보 카드 — 보유 장비·경력·면허 인라인 수정
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import type { Profile, EquipmentCode } from '@/types'
import { EQUIPMENT_CODES_LIST, EQUIPMENT_LABELS } from '@/types'

interface Props {
  profile: Profile
  certApproved: boolean
}

const PencilIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function InlineDriverInfoCard({ profile, certApproved: initCert }: Props) {
  // ── 보유 장비 ──
  const [editEquip, setEditEquip] = useState(false)
  const [equips, setEquips] = useState<EquipmentCode[]>(profile.preferred_equipment_codes ?? [])
  const [tempEquips, setTempEquips] = useState<EquipmentCode[]>([])
  const [savingEquip, setSavingEquip] = useState(false)

  // ── 현장 경력 ──
  const [editExp, setEditExp] = useState(false)
  const [expYears, setExpYears] = useState<number | null>(profile.experience_years)
  const [tempExp, setTempExp] = useState('')
  const [savingExp, setSavingExp] = useState(false)

  // ── 면허·안전교육 ──
  const [editCert, setEditCert] = useState(false)
  const [certApproved, setCertApproved] = useState(initCert)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [uploadingCert, setUploadingCert] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function saveEquipment() {
    setSavingEquip(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_equipment_codes: tempEquips }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '저장 실패')
      setEquips(tempEquips)
      setEditEquip(false)
      toast.success('저장되었습니다.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSavingEquip(false)
    }
  }

  async function saveExperience() {
    setSavingExp(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experience_years: tempExp !== '' ? Number(tempExp) : null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '저장 실패')
      setExpYears(tempExp !== '' ? Number(tempExp) : null)
      setEditExp(false)
      toast.success('저장되었습니다.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSavingExp(false)
    }
  }

  async function uploadCert() {
    if (!certFile) { toast.error('파일을 선택해 주세요.'); return }
    setUploadingCert(true)
    try {
      const form = new FormData()
      form.append('file', certFile)
      const res = await fetch('/api/certifications', { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).error ?? '업로드 실패')
      toast.success('서류가 제출되었습니다. 검토 후 승인됩니다.')
      setCertFile(null)
      setEditCert(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setUploadingCert(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-sm font-bold text-slate-800 mb-3">기사 정보</p>

      {/* ── 보유 장비 ── */}
      <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">보유 장비</p>
          {!editEquip ? (
            <button onClick={() => { setTempEquips([...equips]); setEditEquip(true) }}
              className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-colors">
              <PencilIcon />
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={() => setEditEquip(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded-lg hover:bg-gray-100 transition-colors">
                취소
              </button>
              <button onClick={saveEquipment} disabled={savingEquip}
                className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-0.5 rounded-lg disabled:opacity-50 transition-colors">
                {savingEquip ? '저장 중' : '저장'}
              </button>
            </div>
          )}
        </div>

        {editEquip ? (
          <div className="grid grid-cols-4 gap-1.5">
            {EQUIPMENT_CODES_LIST.map(code => (
              <button key={code} type="button"
                onClick={() => setTempEquips(prev =>
                  prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
                )}
                className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  tempEquips.includes(code)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                }`}>
                {EQUIPMENT_LABELS[code]}
              </button>
            ))}
          </div>
        ) : equips.length > 0 ? (
          <div className="flex gap-1.5 flex-wrap">
            {equips.map(code => (
              <span key={code} className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {EQUIPMENT_LABELS[code]}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">등록된 장비 없음</p>
        )}
      </div>

      {/* ── 3-col 그리드 ── */}
      <div className="grid grid-cols-3 gap-2">

        {/* 현장 경력 */}
        <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1.5">
            <p className="text-xs text-gray-400">현장 경력</p>
            {!editExp && (
              <button onClick={() => { setTempExp(expYears != null ? String(expYears) : ''); setEditExp(true) }}
                className="p-0.5 rounded text-gray-300 hover:text-blue-600 hover:bg-blue-100 transition-colors">
                <PencilIcon className="w-3 h-3" />
              </button>
            )}
          </div>
          {editExp ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <input type="number" value={tempExp} onChange={e => setTempExp(e.target.value)}
                  min={0} max={50} placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                <span className="text-xs text-gray-500 shrink-0">년</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditExp(false)}
                  className="flex-1 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                  취소
                </button>
                <button onClick={saveExperience} disabled={savingExp}
                  className="flex-1 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {savingExp ? '...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-gray-800">
              {expYears != null ? `${expYears}년` : '—'}
            </p>
          )}
        </div>

        {/* 면허·안전교육 */}
        <div className={`border rounded-xl p-3 text-center ${certApproved ? 'border-blue-100 bg-blue-50/30' : 'border-red-100 bg-red-50/30'}`}>
          <div className="flex items-center justify-center gap-1 mb-1.5">
            <p className="text-xs text-gray-400">면허·안전교육</p>
            {!editCert && (
              <button onClick={() => setEditCert(true)}
                className="p-0.5 rounded text-gray-300 hover:text-blue-600 hover:bg-blue-100 transition-colors">
                <PencilIcon className="w-3 h-3" />
              </button>
            )}
          </div>
          {editCert ? (
            <div className="space-y-1.5">
              <input ref={fileRef} type="file" accept="image/*,.pdf"
                onChange={e => setCertFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-gray-500 file:mr-1 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:text-xs file:font-semibold hover:file:bg-blue-100 cursor-pointer" />
              {certFile && <p className="text-xs text-gray-400 truncate">{certFile.name}</p>}
              <div className="flex gap-1">
                <button onClick={() => { setEditCert(false); setCertFile(null) }}
                  className="flex-1 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                  취소
                </button>
                <button onClick={uploadCert} disabled={uploadingCert || !certFile}
                  className="flex-1 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {uploadingCert ? '...' : '제출'}
                </button>
              </div>
            </div>
          ) : certApproved ? (
            <p className="text-sm font-bold text-blue-600">이수완료</p>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-sm font-bold text-gray-400">미등록</p>
              <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                등록 필수
              </span>
            </div>
          )}
        </div>

        {/* 평점 — 수정 불가 */}
        <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-1.5">평점</p>
          <p className="text-sm font-bold text-gray-800">
            <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
          </p>
        </div>
      </div>
    </div>
  )
}
