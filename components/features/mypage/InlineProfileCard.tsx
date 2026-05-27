'use client'

// 마이페이지 프로필 카드 — 연필 클릭으로 인라인 수정 (이름·전화번호·한줄소개·차고지)
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

const PencilIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function InlineProfileCard({ profile, jobCount = 0 }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddress, setShowAddress] = useState(false)

  // 화면에 표시되는 값 (저장 후 낙관적 업데이트)
  const [dName, setDName] = useState(profile.name ?? '')
  const [dPhone, setDPhone] = useState(profile.phone ?? '')
  const [dBio, setDBio] = useState(profile.bio ?? '')
  const [dGarage, setDGarage] = useState(profile.garage_address ?? '')

  // 수정 버퍼
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

  function cancelEdit() {
    setEditing(false)
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
      <div className="flex items-start gap-5">

        {/* 아바타 */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
          {dName?.charAt(0) ?? '?'}
        </div>

        {/* 이름·역할·전화·소개 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition" />
              <input type="text" value={bio} onChange={e => setBio(e.target.value)} placeholder="한 줄 소개" maxLength={80}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition" />
              {profile.role === 'manager' && (
                <div className="flex gap-2">
                  <div className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 min-h-[38px] flex items-center">
                    {garage ? <span className="text-gray-800">{garage}</span> : <span className="text-gray-300">차고지 주소 검색</span>}
                  </div>
                  <button type="button" onClick={() => setShowAddress(true)}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 rounded-xl transition-colors">
                    검색
                  </button>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={cancelEdit}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                  취소
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h1 className="text-lg font-black text-gray-900">{dName}</h1>
                <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {ROLE_LABEL[profile.role]}
                </span>
                {profile.is_certified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold border border-blue-200 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    인증
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-1">{dPhone || '전화번호 미등록'}</p>
              {dBio
                ? <p className="text-xs text-gray-500">&ldquo;{dBio}&rdquo;</p>
                : <p className="text-xs text-gray-300 italic">한 줄 소개를 등록해 보세요</p>}
            </>
          )}
        </div>

        {/* 우측: 평점(기사) + 연필 */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {profile.role === 'driver' && (
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">평점</p>
              <p className="text-xl font-black text-gray-900">
                <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
              </p>
            </div>
          )}
          {!editing && (
            <button onClick={openEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="프로필 수정">
              <PencilIcon />
            </button>
          )}
        </div>
      </div>

      {/* 소장 배지 행 */}
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
