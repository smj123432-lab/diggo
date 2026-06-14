import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 특정 일감의 모든 장비 슬롯이 배차됐는지 확인하고,
 * 충족됐을 때만 jobs.status를 'in_progress'로 전환한다.
 *
 * **채팅 배차 슬롯 보정 로직**
 * 소장이 채팅방 메뉴로 직접 배차한 경우 applications.applied_equipment_code가 null이다.
 * 이때 어느 장비 슬롯을 채우는지 알 수 없으므로, 아직 배차되지 않은 슬롯에
 * 순서대로 채팅 배차 건수를 채워 넣는 방식으로 근사 처리한다.
 *
 * 결과적으로 "일반 지원 배차 + 채팅 배차"를 합산해 requiredCodes를 모두 덮을 때만
 * in_progress로 전환하여 부분 배차 상태를 안전하게 보호한다.
 */
export async function checkAndTransitionJobStatus(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  const { data: job } = await supabase
    .from('jobs')
    .select('equipment_codes, status')
    .eq('id', jobId)
    .single()

  if (!job || job.status === 'in_progress') return

  const requiredCodes: string[] = job.equipment_codes ?? []
  if (requiredCodes.length === 0) {
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', jobId)
    return
  }

  const { data: acceptedApps } = await supabase
    .from('applications')
    .select('applied_equipment_code')
    .eq('job_id', jobId)
    .eq('status', 'accepted')

  const acceptedList = acceptedApps ?? []

  const dispatchedCodes = new Set(
    acceptedList
      .map((a) => a.applied_equipment_code as string | null)
      .filter(Boolean) as string[]
  )

  // 채팅 배차(applied_equipment_code=null)는 미배차 슬롯에 순서대로 귀속
  const chatDispatchCount = acceptedList.filter((a) => !a.applied_equipment_code).length
  if (chatDispatchCount > 0) {
    let remaining = chatDispatchCount
    for (const code of requiredCodes) {
      if (remaining <= 0) break
      if (!dispatchedCodes.has(code)) {
        dispatchedCodes.add(code)
        remaining--
      }
    }
  }

  const allDispatched = requiredCodes.every((code) => dispatchedCodes.has(code))
  if (allDispatched) {
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', jobId)
  }
}

/**
 * 특정 일감에서 각 장비 코드별 배차 완료 여부를 반환한다.
 *
 * 채팅 배차(applied_equipment_code=null)는 `checkAndTransitionJobStatus`와
 * 동일한 슬롯 보정 로직을 적용하여 UI의 배차 현황 표시와 상태 전환 판단을 일치시킨다.
 *
 * @returns `{ '008': true, '017': false }` 형태의 장비코드 → 배차 여부 맵
 */
export async function getJobEquipmentDispatchStatus(
  supabase: SupabaseClient,
  jobId: string,
  equipmentCodes: string[]
): Promise<Record<string, boolean>> {
  if (equipmentCodes.length === 0) return {}

  const { data: acceptedApps } = await supabase
    .from('applications')
    .select('applied_equipment_code')
    .eq('job_id', jobId)
    .eq('status', 'accepted')

  const acceptedList = acceptedApps ?? []

  const dispatchedCodes = new Set(
    acceptedList
      .map((a) => a.applied_equipment_code as string | null)
      .filter(Boolean) as string[]
  )

  // 채팅 배차(applied_equipment_code=null)는 미배차 슬롯에 순서대로 귀속
  const chatDispatchCount = acceptedList.filter((a) => !a.applied_equipment_code).length
  if (chatDispatchCount > 0) {
    let remaining = chatDispatchCount
    for (const code of equipmentCodes) {
      if (remaining <= 0) break
      if (!dispatchedCodes.has(code)) {
        dispatchedCodes.add(code)
        remaining--
      }
    }
  }

  return Object.fromEntries(
    equipmentCodes.map((code) => [code, dispatchedCodes.has(code)])
  )
}
