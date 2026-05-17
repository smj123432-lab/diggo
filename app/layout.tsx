import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Diggo — 굴착기 배차 플랫폼',
  description: '굴착기 기사와 소장을 연결하는 배차 플랫폼. 전자장부로 수입을 관리하세요.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
