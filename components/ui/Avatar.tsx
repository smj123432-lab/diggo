'use client'

// 유저 아바타 — Next.js Image 최적화 적용
import Image from 'next/image'

interface AvatarProps {
  src: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE: Record<NonNullable<AvatarProps['size']>, { wrapper: string; px: number; icon: string }> = {
  sm:  { wrapper: 'w-6 h-6',   px: 24,  icon: 'w-4 h-4' },
  md:  { wrapper: 'w-14 h-14', px: 56,  icon: 'w-7 h-7' },
  lg:  { wrapper: 'w-16 h-16', px: 64,  icon: 'w-8 h-8' },
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const { wrapper, px, icon } = SIZE[size]
  return (
    <div className={`${wrapper} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg className={`${icon} text-gray-400`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      )}
    </div>
  )
}
