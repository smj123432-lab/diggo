'use client'

// 채팅방 상단 우측 ⋮ 메뉴 드롭다운 — 소장(배치 수락/거절, 기사 프로필) / 기사(게시물 확인, 소장 프로필) 공통
import Link from 'next/link'
import type { ApplicationStatus } from '@/types'

interface ChatRoomMenuProps {
  isManager: boolean
  appStatus: ApplicationStatus | null
  isDispatching: boolean
  isLeaving: boolean
  roomId: string
  jobId: string
  driverId: string
  managerId: string
  menuRef: React.RefObject<HTMLDivElement | null>
  menuBtnRef: React.RefObject<HTMLButtonElement | null>
  menuOpen: boolean
  onToggleMenu: () => void
  onDispatch: (action: 'accept' | 'reject') => void
  onLeaveRequest: () => void
}

export function ChatRoomMenu({
  isManager,
  appStatus,
  isDispatching,
  isLeaving,
  roomId,
  jobId,
  driverId,
  managerId,
  menuRef,
  menuBtnRef,
  menuOpen,
  onToggleMenu,
  onDispatch,
  onLeaveRequest,
}: ChatRoomMenuProps) {
  return (
    <div className="relative shrink-0">
      <button
        ref={menuBtnRef}
        onClick={onToggleMenu}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="메뉴"
        disabled={isDispatching || isLeaving}
      >
        <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
        >
          {isManager ? (
            <>
              {appStatus === 'accepted' ? (
                <div className="px-4 py-3 text-sm text-emerald-600 font-semibold bg-emerald-50">
                  ✓ 이미 수락한 기사입니다
                </div>
              ) : appStatus === 'rejected' ? (
                <div className="px-4 py-3 text-sm text-gray-400 font-semibold bg-gray-50">
                  거절된 기사입니다
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onDispatch('accept')}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    배치 수락
                  </button>
                  <button
                    onClick={() => onDispatch('reject')}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                    배치 거절
                  </button>
                </>
              )}
              <Link
                href={`/profiles/${driverId}`}
                onClick={onToggleMenu}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                기사 프로필 보기
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/jobs/${jobId}`}
                onClick={onToggleMenu}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
                </svg>
                게시물 확인
              </Link>
              <Link
                href={`/profiles/${managerId}`}
                onClick={onToggleMenu}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                소장 프로필 보기
              </Link>
            </>
          )}

          <button
            onClick={() => { onToggleMenu(); onLeaveRequest() }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors border-t border-gray-100"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            채팅방 나가기
          </button>
        </div>
      )}
    </div>
  )
}
