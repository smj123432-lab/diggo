// 관리자 대시보드 → 마이페이지 관제 센터로 통합 이전
import { redirect } from 'next/navigation'

export default function AdminPage() {
  redirect('/mypage?tab=certs')
}
