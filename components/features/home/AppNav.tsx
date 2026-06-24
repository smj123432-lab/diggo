// 공통 상단 네비게이션 바 — 전체 레이아웃 일감찾기/장부/역할링크 포함
import Link from 'next/link'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'

interface Props {
  /** 현재 활성화된 중앙 네비게이션 링크 */
  activeLink?: 'jobs' | 'ledger' | 'role'
  /** 숨길 중앙 네비게이션 링크 목록 (예: admin 페이지에서 장부 숨김) */
  hideLinks?: ('jobs' | 'ledger' | 'role')[]
}

export function AppNav({ activeLink, hideLinks }: Props) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2.5">
          <ExcavatorIcon className="w-10 h-8 text-blue-400" />
          <span className="text-lg font-black tracking-tight text-white">
            Diggo<span className="text-blue-400">.</span>
          </span>
        </Link>

        {/* 중앙 네비게이션 */}
        <div className="hidden md:flex items-center gap-1">
          {!hideLinks?.includes('jobs') && (
            <Link
              href="/jobs"
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeLink === 'jobs'
                  ? 'font-semibold text-white bg-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              일감 찾기
            </Link>
          )}
{!hideLinks?.includes('role') && <NavRoleLink />}
        </div>

        {/* 우측 버튼 */}
        <NavButtons />
      </div>
    </nav>
  )
}
