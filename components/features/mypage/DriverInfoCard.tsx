'use client'

// 기사 정보 카드 — 보유 장비·경력·면허 표시 + 정보 수정 버튼
import { useState } from 'react'
import type { Profile, EquipmentCode } from '@/types'
import { EquipmentBadge } from '@/components/ui/EquipmentBadge'
import { DriverInfoEditModal } from './DriverInfoEditModal'

interface Props {
  profile: Profile
  initialEquipments: { id: string; model_code: EquipmentCode }[]
  certApproved: boolean
  certPending: boolean
}

export function DriverInfoCard({ profile, initialEquipments, certApproved, certPending }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [experienceYears, setExperienceYears] = useState(profile.experience_years)
  const [equipments, setEquipments] = useState(initialEquipments)

  return (
    <>
      <div className="relative bg-white rounded-2xl border border-gray-200 p-5">

        {/* 우측 상단 고정: 정보 수정 버튼 */}
        <button
          onClick={() => setModalOpen(true)}
          className="absolute top-4 right-4 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          정보 수정
        </button>

        <p className="text-sm font-bold text-slate-800 mb-3">기사 정보</p>

        {/* 보유 장비 */}
        <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 mb-3">
          <p className="text-xs text-gray-400 mb-2">보유 장비</p>
          {equipments.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {equipments.map((eq) => (
                <EquipmentBadge key={eq.id} code={eq.model_code} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">등록된 장비 없음</p>
          )}
        </div>

        {/* 경력·면허·평점 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1.5">현장 경력</p>
            <p className="text-sm font-bold text-gray-800">
              {experienceYears != null ? `${experienceYears}년` : '—'}
            </p>
          </div>
          <div className={`border rounded-xl p-3 text-center ${certApproved ? 'border-blue-100 bg-blue-50/30' : certPending ? 'border-yellow-100 bg-yellow-50/30' : 'border-red-100 bg-red-50/30'}`}>
            <p className="text-xs text-gray-400 mb-1.5">면허·안전교육</p>
            {certApproved ? (
              <p className="text-sm font-bold text-blue-600">등록완료</p>
            ) : certPending ? (
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-bold text-yellow-600">제출완료</p>
                <span className="text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">검토중</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-bold text-gray-400">미등록</p>
                <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">등록 필수</span>
              </div>
            )}
          </div>
          <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1.5">평점</p>
            <p className="text-sm font-bold text-gray-800">
              <span className="text-yellow-400">★</span> {profile.rating_avg?.toFixed(1) ?? '0.0'}
            </p>
          </div>
        </div>
      </div>

      {modalOpen && (
        <DriverInfoEditModal
          experienceYears={experienceYears}
          equipmentCodes={equipments.map(e => e.model_code)}
          onClose={() => setModalOpen(false)}
          onSaved={({ experience_years, equipments: newEquipments }) => {
            setExperienceYears(experience_years)
            setEquipments(newEquipments)
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}
