'use client'

// 프로필 카드 인라인 수정 — 3-column 고정 레이아웃 (아바타 | 정보 | 버튼)
// 수정 모드에서도 구조 변경 없이 텍스트 자리에 box 형태 input만 스위칭
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import { AddressSearch } from '@/components/features/jobs/AddressSearch'

const ROLE_LABEL: Record<string, string> = {
  driver: '기사', manager: '소장', admin: '관리자',
}

interface Props {
  profile: Profile
  jobCount?: number
}

export function InlineProfileCard({ profile, jobCount = 0 }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddress, setShowAddress] = useState(false)

  const [dName, setDName] = useState(profile.name ?? '')
  const [dPhone, setDPhone] = useState(profile.phone ?? '')
  const [dBio, setDBio] = useState(profile.bio ?? '')
  const [dGarage, setDGarage] = useState(profile.garage_address ?? '')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [garage, setGarage] = useState('')
  const [lat, setLat] = useState<number | null>(profile.latitude)
  const [lng, setLng] = useState<number | null>(profile.longitude)

  function openEdit() {
    setName(dName); setPhone(dPhone); setBio(dBio); setGarage(dGarage)
    setEditing(true)
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('이름을 입력해 주세요.'); return }
    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      }
      if (profile.role === 'manager') {
        body.garage_address = garage || null
        body.latitude = lat
        body.longitude = lng
      }
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '저장 실패')
      setDName(name.trim())
      setDPhone(phone.trim())
      setDBio(bio.trim())
      setDGarage(garage)
      setEditing(false)
      toast.success('저장되었습니다.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">

      {/* ── 3-column row: 아바타 | 정보 | 우측 버튼 ── */}
      <div className="flex items-start gap-4">

        {/* COL 1: 아바타 (고정) */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
          {dName?.charAt(0) ?? '?'}
        </div>

        {/* COL 2: 이름 · 전화 · 소개 — flex-col, 각 항목 독립 행 */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">

          {/* 이름 행 */}
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-lg font-bold w-36 px-2 py-1 border border-blue-200 rounded-md bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
              />
            ) : (
              <span className="text-lg font-bold text-gray-900">{dName}</span>
            )}
            <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shrink-0">
              {ROLE_LABEL[profile.role]}
            </span>
            {profile.is_certified && (
              <span className="inline-flex items-center gap-1 text-xs font-bold border border-blue-200 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                인증
              </span>
            )}
          </div>

          {/* 전화번호 행 */}
          {editing ? (
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full max-w-xs px-2 py-1 border border-slate-200 rounded-md bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            <p className="text-sm text-gray-500">{dPhone || '전화번호 미등록'}</p>
          )}

          {/* 한 줄 소개 행 */}
          {editing ? (
            <input
              type="text"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="한 줄 소개를 등록해 보세요"
              maxLength={80}
              className="w-full max-w-sm px-2 py-1 border border-slate-200 rounded-md bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            dBio
              ? <p className="text-xs text-gray-500 italic">&ldquo;{dBio}&rdquo;</p>
              : <p className="text-xs text-gray-300 italic">한 줄 소개를 등록해 보세요</p>
          )}

          {/* 소장 차고지 (수정 모드에만) */}
          {editing && profile.role === 'manager' && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 truncate">{garage || '차고지 미등록'}</p>
              <button
                type="button"
                onClick={() => setShowAddress(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 transition-colors"
              >
                변경
              </button>
            </div>
          )}
        </div>

        {/* COL 3: 평점(기사) + 프로필 수정 버튼 */}
        <div className="flex flex-col items-end gap-3 shrink-0">

          {/* 평점 — 기사만, 항상 표시 */}
          {profile.role === 'driver' && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">평점</p>
              <p className="text-xl font-black text-gray-900 leading-none">
                <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
              </p>
            </div>
          )}

          {/* 버튼 토글: [프로필 수정] ↔ [취소][저장] */}
          {editing ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md text-sm hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? '저장 중' : '저장'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openEdit}
              className="text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              프로필 수정
            </button>
          )}
        </div>
      </div>

      {/* 소장 배지 행 (뷰 모드만) */}
      {profile.role === 'manager' && !editing && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          <span className="inline-flex items-center text-xs font-semibold border border-blue-200 text-blue-600 bg-white px-3 py-1 rounded-full">
            누적 일감 {jobCount}건
          </span>
          {dGarage && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold border border-gray-200 text-gray-600 bg-white px-3 py-1 rounded-full">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {dGarage}
            </span>
          )}
        </div>
      )}

      {showAddress && (
        <AddressSearch
          onSelect={({ address_name, latitude, longitude }) => {
            setGarage(address_name); setLat(latitude); setLng(longitude)
            setShowAddress(false)
          }}
          onClose={() => setShowAddress(false)}
        />
      )}
    </div>
  )
}
