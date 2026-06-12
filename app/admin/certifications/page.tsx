// 구 인증 서류 페이지 — 통합 대시보드로 리다이렉트
import { redirect } from 'next/navigation'

export default async function AdminCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  redirect(`/admin?tab=certs${status ? `&status=${status}` : ''}`)
}
