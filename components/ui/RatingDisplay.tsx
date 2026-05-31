// 평점 표시 (별 + 숫자)
interface RatingDisplayProps {
  value: number
  className?: string
}

export function RatingDisplay({ value, className = '' }: RatingDisplayProps) {
  return (
    <span className={`flex items-center gap-0.5 ${className}`} aria-label={`평점 ${value.toFixed(1)}점`}>
      <span className="text-yellow-400" aria-hidden="true">★</span>
      <span>{value.toFixed(1)}</span>
    </span>
  )
}
