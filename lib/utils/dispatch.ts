import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 특정 일감의 모든 장비 슬롯이 배차됐는지 확인하고,
 * 완료됐을 때만 job.status를 'in_progress'로 전환한다.
 * (All-or-Nothing 배차 전환 로직)
 */
export async function checkAndTransitionJobStatus(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  // 일감의 필요 장비 코드 목록 조회
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

  // 이 일감에서 수락된 지원서의 applied_equipment_code 목록
  const { data: acceptedApps } = await supabase
    .from('applications')
    .select('applied_equipment_code')
    .eq('job_id', jobId)
    .eq('status', 'accepted')

  const dispatchedCodes = new Set(
    (acceptedApps ?? [])
      .map((a) => a.applied_equipment_code as string | null)
      .filter(Boolean)
  )

  // 모든 필요 장비 코드가 최소 1건씩 배차됐는지 확인
  const allDispatched = requiredCodes.every((code) => dispatchedCodes.has(code))

  if (allDispatched) {
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', jobId)
  }
}

/**
 * 특정 일감에서 각 장비 코드별 배차 상태를 반환한다.
 * { '008': true, '017': false } 형태
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

  // applied_equipment_code가 있는 배차
  const dispatchedCodes = new Set(
    acceptedList
      .map((a) => a.applied_equipment_code as string | null)
      .filter(Boolean) as string[]
  )

  // applied_equipment_code가 null인 채팅 배차 수 (어느 슬롯인지 불명확)
  const chatDispatchCount = acceptedList.filter((a) => !a.applied_equipment_code).length

  // 아직 배차되지 않은 슬롯 중 채팅 배차 수만큼 순서대로 채움
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
