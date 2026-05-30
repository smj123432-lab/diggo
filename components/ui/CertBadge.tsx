// 인증 기사 체크 배지
interface CertBadgeProps {
  size?: 'sm' | 'md'
}

const SIZE_CLASS = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
}

const ICON_CLASS = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
}

export function CertBadge({ size = 'sm' }: CertBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-blue-500 text-white rounded-full shrink-0 ${SIZE_CLASS[size]}`}
      aria-label="인증 기사"
      title="인증 기사"
    >
      <svg className={ICON_CLASS[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
