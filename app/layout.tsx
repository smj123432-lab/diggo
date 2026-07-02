import type { Metadata } from 'next'
import { Noto_Sans_KR, DM_Mono } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import Providers from './providers'
import { Analytics } from '@vercel/analytics/next'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://diggo-zr4b.vercel.app'),
  title: {
    default: 'Diggo — 굴착기 배차 플랫폼',
    template: '%s | Diggo',
  },
  description: '굴착기 기사와 소장을 연결하는 배차 플랫폼. 일감을 등록하고 검증된 기사를 구하세요.',
  keywords: ['굴착기', '배차', '굴착기 기사', '기사 구인', '토목', '철거', '008', '017', '035'],
  openGraph: {
    siteName: 'Diggo',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} ${dmMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <Suspense>{children}</Suspense>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
