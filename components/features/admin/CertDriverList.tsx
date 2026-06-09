'use client'

// 기사별 인증 서류 목록 — 카드 클릭 시 모달 오픈
import { useState } from 'react'
import { CertReviewModal } from './CertReviewModal'

interface Cert {
  id: string
  cert_type: string
  image_url: string
  status: string
}

export interface DriverEntry {
  driverId: string
  name: string
  email: string
  phone: string
  avatarUrl: string | null
  certs: Cert[]
}

interface Props {
  drivers: DriverEntry[]
}

export function CertDriverList({ drivers }: Props) {
  const [selected, setSelected] = useState<DriverEntry | null>(null)

  if (drivers.length === 0) {
    return (
      <div className="text-center text-gray-400 py-20 bg-white rounded-2xl border border-gray-100">
        해당하는 서류가 없습니다.
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {drivers.map(driver => {
          const displayName = driver.name || driver.email
          const pendingCount = driver.certs.filter(c => c.status === 'pending').length
          const allApproved = driver.certs.every(c => c.status === 'approved')
          const hasRejected = driver.certs.some(c => c.status === 'rejected')

          return (
            <div
              key={driver.driverId}
              className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4"
            >
              {/* 아바타 */}
              {driver.avatarUrl ? (
                <img
                  src={driver.avatarUrl}
                  alt={displayName}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              {/* 기사 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-400">{driver.phone || '번호 미등록'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">서류 {driver.certs.length}건</span>
                  {pendingCount > 0 && (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                      대기 {pendingCount}건
                    </span>
                  )}
                  {allApproved && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                      전체 승인
                    </span>
                  )}
                  {hasRejected && !allApproved && pendingCount === 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      거절 포함
                    </span>
                  )}
                </div>
              </div>

              {/* 확인 버튼 */}
              <button
                onClick={() => setSelected(driver)}
                className="text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shrink-0"
              >
                확인
              </button>
            </div>
          )
        })}
      </div>

      {selected && (
        <CertReviewModal
          driverName={selected.name}
          driverEmail={selected.email}
          driverPhone={selected.phone}
          certs={selected.certs}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
