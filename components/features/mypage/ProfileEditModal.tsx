'use client'

// 프로필 수정 모달 — 이름·전화번호·한 줄 소개 (소장: 차고지 포함)
import { useState } from 'react'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import { AddressSearch } from '@/components/features/jobs/AddressSearch'

interface Updates {
  name: string
  phone: string | null
  bio: string | null
  garage_address?: string | null
  latitude?: number | null
  longitude?: number | null
}

interface Props {
  profile: Profile
  onClose: () => void
  onSaved: (updates: Updates) => void
}

export function ProfileEditModal({ profile, onClose, onSaved }: Props) {
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [garage, setGarage] = useState(profile.garage_address ?? '')
  const [lat, setLat] = useState<number | null>(profile.latitude)
  const [lng, setLng] = useState<number | null>(profile.longitude)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddress, setShowAddress] = useState(false)

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
      toast.success('프로필이 저장되었습니다.')
      onSaved({
        name: name.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        ...(profile.role === 'manager' && {
          garage_address: garage || null,
          latitude: lat,
          longitude: lng,
        }),
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">프로필 수정</h2>
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
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">한 줄 소개</label>
            <input
              type="text"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="나를 한 문장으로 소개해 보세요"
              maxLength={80}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
            <p className="text-right text-xs text-gray-300 mt-1">{bio.length}/80</p>
          </div>

          {profile.role === 'manager' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">차고지 주소</label>
              <div className="flex gap-2">
                <div className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 min-h-[42px] flex items-center">
                  {garage
                    ? <span className="text-gray-800">{garage}</span>
                    : <span className="text-gray-300">주소를 검색하세요</span>
                  }
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddress(true)}
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 rounded-xl transition-colors"
                >
                  검색
                </button>
              </div>
            </div>
          )}
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
