import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        primary: '#F59E0B',
        'primary-dark': '#D97706',
        // ── 브랜드 컬러 ──────────────────────────────
        'brand-blue': {
          DEFAULT: '#3B82F6',  // blue-500 — 버튼, 배지, 포인트
          light:   '#93C5FD',  // blue-300 — hover 보더
          muted:   '#60A5FA',  // blue-400 — 체크박스 hover
          dark:    '#2563EB',  // blue-600 — hover 버튼
          deep:    '#1D4ED8',  // blue-700 — 텍스트 hover
        },
        'brand-purple': '#8B5CF6',  // violet-500 — 선호 별 아이콘
      },
    },
  },
  plugins: [],
}

export default config
