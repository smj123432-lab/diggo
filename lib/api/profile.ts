// 프로필 API 클라이언트 헬퍼 — /api/profile PATCH 공통 fetch 로직
import type { Profile } from '@/types'

export type ProfileUpdateData = Record<string, unknown>

/**
 * 프로필 수정 API 호출
 * 성공 시 업데이트된 Profile 반환, 실패 시 에러 throw
 */
export async function updateProfile(data: ProfileUpdateData): Promise<Profile> {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).error ?? '수정 실패')
  const json = await res.json()
  return json.data as Profile
}
