// 빈 상태 공용 컴포넌트 — 목록이 비었을 때 일관된 UI 제공
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 gap-3 text-center ${className}`}>
      {icon && <div className="text-4xl leading-none">{icon}</div>}
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
