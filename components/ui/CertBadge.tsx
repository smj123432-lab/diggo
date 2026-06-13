// 평점 기반 뱃지 — top(우수 평점 ≥4.5), low(저평점 ≤2.0)
interface CertBadgeProps {
  variant: 'top' | 'low'
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

export function CertBadge({ variant, size = 'sm' }: CertBadgeProps) {
  if (variant === 'top') {
    return (
      <span
        className={`inline-flex items-center justify-center bg-amber-400 text-white rounded-full shrink-0 ${SIZE_CLASS[size]}`}
        aria-label="우수 평점"
        title="우수 평점 (4.5점 이상)"
      >
        <svg className={ICON_CLASS[size]} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center bg-red-500 text-white rounded-full shrink-0 ${SIZE_CLASS[size]}`}
      aria-label="저평점 주의"
      title="저평점 주의 (2.0점 이하)"
    >
      <svg className={ICON_CLASS[size]} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    </span>
  )
}
