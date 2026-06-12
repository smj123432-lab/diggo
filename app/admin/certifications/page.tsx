// 구 인증 서류 페이지 → 마이페이지 관제 센터로 직접 리다이렉트
import { redirect } from 'next/navigation'

export default async function AdminCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  redirect(`/mypage?tab=certs${status ? `&status=${status}` : ''}`)
}
