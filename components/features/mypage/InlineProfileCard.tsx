'use client'

// 마이페이지 프로필 카드 — [프로필 수정] 버튼 클릭 시 모달 팝업
import { useState } from 'react'
import type { Profile } from '@/types'
import { ProfileEditModal } from './ProfileEditModal'

const ROLE_LABEL: Record<string, string> = {
  driver: '기사', manager: '소장', admin: '관리자',
}

interface Props {
  profile: Profile
  jobCount?: number
}

export function InlineProfileCard({ profile, jobCount = 0 }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  // 낙관적 업데이트용 로컬 상태
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [garage, setGarage] = useState(profile.garage_address ?? '')

  const initial = name?.charAt(0) ?? '?'

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-5">

          {/* 아바타 */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
            {initial}
          </div>

          {/* 이름·역할·전화번호·한 줄 소개 */}
          <div className="flex-1 min-w-0">
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
            </div>
            <p className="text-sm text-gray-500 mb-1">{phone || '전화번호 미등록'}</p>
            {bio
              ? <p className="text-xs text-gray-500">&ldquo;{bio}&rdquo;</p>
              : <p className="text-xs text-gray-300 italic">한 줄 소개를 등록해 보세요</p>
            }
          </div>

          {/* 우측: 평점(기사) + 프로필 수정 버튼 */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {profile.role === 'driver' && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">평점</p>
                <p className="text-xl font-black text-gray-900">
                  <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
                </p>
              </div>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              프로필 수정
            </button>
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
