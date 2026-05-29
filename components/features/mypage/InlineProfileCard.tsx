'use client'

// 마이페이지 프로필 카드 — [프로필 수정] 버튼 클릭 시 모달 팝업
import { useState, useRef } from 'react'
import type { Profile } from '@/types'
import { ProfileEditModal } from './ProfileEditModal'
import { toast } from 'sonner'

const ROLE_LABEL: Record<string, string> = {
  driver: '기사', manager: '소장', admin: '관리자',
}

interface Props {
  profile: Profile
  jobCount?: number
}

export function InlineProfileCard({ profile, jobCount = 0 }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [garage, setGarage] = useState(profile.garage_address ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initial = name?.charAt(0) ?? '?'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '업로드에 실패했습니다.')
        return
      }
      setAvatarUrl(json.avatar_url)
      toast.success('프로필 사진이 변경되었습니다.')
    } catch {
      toast.error('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      // input 초기화 (같은 파일 재선택 가능)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="relative bg-white border border-gray-200 rounded-2xl p-5">

        {/* 우측 상단 고정: 프로필 수정 버튼 */}
        <button
          onClick={() => setModalOpen(true)}
          className="absolute top-4 right-4 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          프로필 수정
        </button>

        <div className="flex items-center gap-4">

          {/* 아바타 + 연필 아이콘 */}
          <div className="relative shrink-0 group">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-16 h-16 rounded-2xl overflow-hidden block focus:outline-none"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-2xl font-black text-white">
                  {uploading ? (
                    <svg className="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : initial}
                </div>
              )}
            </button>

            {/* 연필 아이콘 오버레이 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-sm transition-colors"
            >
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* 이름·역할·평점·전화번호·한 줄 소개 */}
          <div className="flex-1 min-w-0 pr-20">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-lg font-black text-gray-900">{name}</h1>
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
              {profile.role === 'driver' && (
                <span className="text-xs font-semibold text-gray-500">
                  <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">{phone || '전화번호 미등록'}</p>
            {bio
              ? <p className="text-xs text-gray-500">&ldquo;{bio}&rdquo;</p>
              : <p className="text-xs text-gray-300 italic">한 줄 소개를 등록해 보세요</p>
            }
          </div>
        </div>

        {/* 소장 배지 행 */}
        {profile.role === 'manager' && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
            <span className="inline-flex items-center text-xs font-semibold border border-blue-200 text-blue-600 bg-white px-3 py-1 rounded-full">
              누적 일감 {jobCount}건
            </span>
            {garage && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold border border-gray-200 text-gray-600 bg-white px-3 py-1 rounded-full">
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {garage}
              </span>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <ProfileEditModal
          profile={{ ...profile, name, phone, bio: bio || null, garage_address: garage || null }}
          onClose={() => setModalOpen(false)}
          onSaved={(updates) => {
            setName(updates.name)
            setPhone(updates.phone ?? '')
            setBio(updates.bio ?? '')
            if (updates.garage_address !== undefined) setGarage(updates.garage_address ?? '')
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}
