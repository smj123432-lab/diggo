/**
 * 시드 스크립트 — 소장 3명 + 기사 5명 + 일감·지원·리뷰·채팅 데이터 삽입
 * 실행: bun run scripts/seed.ts
 */
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const PASSWORD = 'Diggo1234!'

// ── 유저 정의 ─────────────────────────────────────────────────────────────────

const MANAGERS = [
  { email: 'manager1@naver.com', name: '박현수', bio: '수원·화성 지역 토목 현장 소장 15년 경력' },
  { email: 'manager2@naver.com', name: '김동현', bio: '서울 강남·서초 재개발 전문 현장 소장' },
  { email: 'manager3@naver.com', name: '이상철', bio: '인천 물류·공단 지역 현장 소장 20년' },
]

const DRIVERS = [
  { email: 'driver1@naver.com', name: '최민준', bio: '008·017 전문, 도심 현장 8년', years: 8,  codes: ['008', '017'] },
  { email: 'driver2@naver.com', name: '정우성', bio: '035·02 전문, 대형 토목 12년', years: 12, codes: ['035', '02'] },
  { email: 'driver3@naver.com', name: '강태양', bio: '휠굴착기(3w·6w) 전문 5년',  years: 5,  codes: ['3w', '6w'] },
  { email: 'driver4@naver.com', name: '윤석진', bio: '대형 장비(8w·10t) 전문 15년', years: 15, codes: ['8w', '10t'] },
  { email: 'driver5@naver.com', name: '허준호', bio: '008·035 다목적 운용 10년',   years: 10, codes: ['008', '035'] },
]

// ── 일감 정의 ─────────────────────────────────────────────────────────────────

function buildJobs(mIds: string[]) {
  const [m1, m2, m3] = mIds
  return [
    // open — 모집중
    { manager_id: m1, title: '수원 망포 택지개발 기초 굴착', job_type: 'civil', equipment_codes: ['008', '017'],
      description: '망포 신도시 2블록 기초 굴착. 현장 협소하니 안전 주의 요망.',
      location: '경기도 수원시 영통구 망포동 125-3', latitude: 37.2497, longitude: 127.0699,
      pay_amounts: { '008': 450000, '017': 550000 }, work_days: { '008': 3, '017': 3 },
      work_date: '2026-07-08', work_duration: 'week_1', pay_due_type: 'same_day', status: 'open' },

    { manager_id: m1, title: '화성 동탄 물류창고 부지 정지작업', job_type: 'civil', equipment_codes: ['035'],
      description: '물류창고 신축 부지 정지작업 및 잡토 처리. 경험자 우대.',
      location: '경기도 화성시 동탄면 석우리 440', latitude: 37.2067, longitude: 127.0727,
      pay_amounts: { '035': 700000 }, work_days: { '035': 5 },
      work_date: '2026-07-12', work_duration: 'week_1', pay_due_type: 'd3', status: 'open' },

    { manager_id: m2, title: '강남 논현동 빌라 철거 작업', job_type: 'demolition', equipment_codes: ['008', '035'],
      description: '지하 1층 지상 4층 빌라 철거. 인접 건물 있으니 정밀 작업 필수.',
      location: '서울특별시 강남구 논현동 93-12', latitude: 37.5117, longitude: 127.0337,
      pay_amounts: { '008': 500000, '035': 750000 }, work_days: { '008': 2, '035': 4 },
      work_date: '2026-07-15', work_duration: 'week_1', pay_due_type: 'same_day', status: 'open' },

    { manager_id: m2, title: '서초 방배동 단독주택 기초 터파기', job_type: 'civil', equipment_codes: ['008'],
      description: '단독주택 신축 기초 터파기. 인접 주택가라 저소음 장비 우대.',
      location: '서울특별시 서초구 방배동 457-8', latitude: 37.4812, longitude: 126.9939,
      pay_amounts: { '008': 480000 }, work_days: { '008': 2 },
      work_date: '2026-07-10', work_duration: 'day_1', pay_due_type: 'same_day', status: 'open' },

    { manager_id: m3, title: '인천 남동공단 공장 증축 기초공사', job_type: 'civil', equipment_codes: ['035', '02'],
      description: '공장 동관 증축 기초공사. 넓은 부지, 작업 환경 양호.',
      location: '인천광역시 남동구 고잔동 627', latitude: 37.4102, longitude: 126.7219,
      pay_amounts: { '035': 680000, '02': 600000 }, work_days: { '035': 7, '02': 7 },
      work_date: '2026-07-07', work_duration: 'week_2', pay_due_type: 'd7', status: 'open' },

    { manager_id: m3, title: '인천항 배후단지 도로 절개 작업', job_type: 'civil', equipment_codes: ['6w', '8w'],
      description: '항만 배후단지 도로 절개 및 측구 굴착. 야간 가능자 우대.',
      location: '인천광역시 중구 항동7가 1-1', latitude: 37.4774, longitude: 126.6212,
      pay_amounts: { '6w': 620000, '8w': 800000 }, work_days: { '6w': 3, '8w': 3 },
      work_date: '2026-07-20', work_duration: 'week_1', pay_due_type: 'd3', status: 'open' },

    // settled — 정산완료 (리뷰용)
    { manager_id: m1, title: '수원 권선 아파트 조경 굴착', job_type: 'civil', equipment_codes: ['008'],
      description: '아파트 단지 조경 터파기 완료.',
      location: '경기도 수원시 권선구 권선동 1200', latitude: 37.2527, longitude: 126.9844,
      pay_amounts: { '008': 420000 }, work_days: { '008': 2 },
      work_date: '2026-06-10', work_duration: 'day_1', pay_due_type: 'same_day', status: 'settled' },

    { manager_id: m1, title: '화성 향남 상업시설 부지 정지', job_type: 'civil', equipment_codes: ['008'],
      description: '상업시설 부지 정지작업 완료.',
      location: '경기도 화성시 향남읍 행정리 510', latitude: 37.1558, longitude: 126.9928,
      pay_amounts: { '008': 460000 }, work_days: { '008': 3 },
      work_date: '2026-05-28', work_duration: 'week_1', pay_due_type: 'same_day', status: 'settled' },

    { manager_id: m1, title: '수원 팔달 상가 리모델링 철거', job_type: 'demolition', equipment_codes: ['008'],
      description: '상가 내부 철거 작업 완료.',
      location: '경기도 수원시 팔달구 팔달로 100', latitude: 37.2836, longitude: 127.0157,
      pay_amounts: { '008': 440000 }, work_days: { '008': 2 },
      work_date: '2026-05-15', work_duration: 'day_1', pay_due_type: 'same_day', status: 'settled' },

    { manager_id: m2, title: '강남 역삼 오피스텔 철거', job_type: 'demolition', equipment_codes: ['008'],
      description: '노후 오피스텔 철거 완료.',
      location: '서울특별시 강남구 역삼동 736', latitude: 37.5005, longitude: 127.0363,
      pay_amounts: { '008': 500000 }, work_days: { '008': 2 },
      work_date: '2026-06-15', work_duration: 'week_1', pay_due_type: 'd3', status: 'settled' },

    { manager_id: m2, title: '서초 잠원 단독주택 기초 굴착', job_type: 'civil', equipment_codes: ['008'],
      description: '단독주택 기초 굴착 완료.',
      location: '서울특별시 서초구 잠원동 30-5', latitude: 37.5128, longitude: 127.0079,
      pay_amounts: { '008': 480000 }, work_days: { '008': 2 },
      work_date: '2026-05-20', work_duration: 'day_1', pay_due_type: 'same_day', status: 'settled' },

    { manager_id: m3, title: '인천 서구 공동주택 기초 굴착', job_type: 'civil', equipment_codes: ['3w'],
      description: '공동주택 기초 굴착 완료.',
      location: '인천광역시 서구 검단동 870', latitude: 37.5832, longitude: 126.7243,
      pay_amounts: { '3w': 580000 }, work_days: { '3w': 3 },
      work_date: '2026-06-05', work_duration: 'week_1', pay_due_type: 'd7', status: 'settled' },

    { manager_id: m3, title: '인천 부평 공장 부지 정지', job_type: 'civil', equipment_codes: ['3w'],
      description: '공장 부지 정지작업 완료.',
      location: '인천광역시 부평구 청천동 260', latitude: 37.5044, longitude: 126.7227,
      pay_amounts: { '3w': 560000 }, work_days: { '3w': 3 },
      work_date: '2026-05-10', work_duration: 'week_1', pay_due_type: 'd3', status: 'settled' },
  ]
}

// ── 채팅 메시지 샘플 ─────────────────────────────────────────────────────────

const CHAT_SCRIPTS = [
  [
    { from: 'manager', text: '안녕하세요. 일감 보시고 연락주셨나요?' },
    { from: 'driver',  text: '네, 안녕하세요. 008 장비 있고요, 해당 날짜 작업 가능합니다.' },
    { from: 'manager', text: '경력은 어떻게 되시나요?' },
    { from: 'driver',  text: '8년 됐고요, 도심 현장 위주로 해왔습니다.' },
    { from: 'manager', text: '좋습니다. 일감 확인하시고 지원 눌러주시면 바로 수락할게요.' },
    { from: 'driver',  text: '감사합니다. 지원 넣겠습니다!' },
  ],
  [
    { from: 'driver',  text: '소장님, 해당 현장 작업 관련해서 문의드립니다.' },
    { from: 'manager', text: '네, 말씀하세요.' },
    { from: 'driver',  text: '작업 시작 시간이 몇 시인가요?' },
    { from: 'manager', text: '오전 7시 30분 현장 집결입니다. 주차 공간은 현장 앞 공터 이용하시면 됩니다.' },
    { from: 'driver',  text: '알겠습니다. 시간 맞춰 가겠습니다.' },
    { from: 'manager', text: '수고하세요. 당일 현장에서 뵙겠습니다.' },
  ],
  [
    { from: 'manager', text: '안녕하세요, 프로필 보고 연락드립니다. 내주 작업 가능하신가요?' },
    { from: 'driver',  text: '안녕하세요! 내주 스케줄 확인해봤는데 가능합니다.' },
    { from: 'manager', text: '혹시 035 장비 상태는 어떤가요?' },
    { from: 'driver',  text: '최근에 정비 마쳤고요, 컨디션 좋습니다.' },
    { from: 'manager', text: '알겠습니다. 지원 주시면 검토 후 연락드리겠습니다.' },
  ],
]

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function getOrCreateUser(email: string, name: string, role: 'manager' | 'driver') {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users.find(u => u.email === email)
  if (existing) {
    console.log(`  ⚠️  ${name} (${email}) 이미 존재`)
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { name, role },
  })
  if (error) throw error
  return data.user.id
}

async function upsertProfile(id: string, updates: Record<string, unknown>) {
  const { error } = await admin.from('profiles').update(updates).eq('id', id)
  if (error) throw error
}

async function insertEquipments(ownerId: string, codes: string[]) {
  const { data: existing } = await admin.from('equipments').select('model_code').eq('owner_id', ownerId)
  const existingCodes = (existing ?? []).map(e => e.model_code)
  const newCodes = codes.filter(c => !existingCodes.includes(c))
  if (newCodes.length === 0) {
    const { data } = await admin.from('equipments').select('id, model_code').eq('owner_id', ownerId)
    return data ?? []
  }
  const { data, error } = await admin.from('equipments')
    .insert(newCodes.map(code => ({ owner_id: ownerId, model_code: code, type: 'excavator' })))
    .select('id, model_code')
  if (error) throw error
  const { data: all } = await admin.from('equipments').select('id, model_code').eq('owner_id', ownerId)
  return all ?? []
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🌱 시드 시작\n')

  // 1. 소장 계정
  console.log('── 소장 계정')
  const managerIds: string[] = []
  for (const m of MANAGERS) {
    const id = await getOrCreateUser(m.email, m.name, 'manager')
    await upsertProfile(id, { bio: m.bio, phone: `010-${rand(1000,9999)}-${rand(1000,9999)}` })
    managerIds.push(id)
    console.log(`  ✅ ${m.name}`)
  }

  // 2. 기사 계정 + 장비
  console.log('\n── 기사 계정')
  const drivers: { id: string; name: string; equipments: { id: string; model_code: string }[] }[] = []
  for (const d of DRIVERS) {
    const id = await getOrCreateUser(d.email, d.name, 'driver')
    await upsertProfile(id, { bio: d.bio, experience_years: d.years, phone: `010-${rand(1000,9999)}-${rand(1000,9999)}` })
    const equipments = await insertEquipments(id, d.codes)
    drivers.push({ id, name: d.name, equipments })
    console.log(`  ✅ ${d.name} — 장비: ${d.codes.join(', ')}`)
  }

  // 3. 일감 등록
  console.log('\n── 일감 등록')
  const { data: existingJobs } = await admin.from('jobs').select('id').in('manager_id', managerIds)
  let jobs: { id: string; title: string; status: string; equipment_codes: string[]; manager_id: string }[] = []

  if (existingJobs && existingJobs.length > 0) {
    console.log(`  ⚠️  일감 이미 존재 (${existingJobs.length}개) — 기존 데이터 사용`)
    const { data } = await admin.from('jobs').select('id, title, status, equipment_codes, manager_id').in('manager_id', managerIds)
    jobs = data ?? []
  } else {
    const { data, error } = await admin.from('jobs').insert(buildJobs(managerIds)).select('id, title, status, equipment_codes, manager_id')
    if (error) throw error
    jobs = data ?? []
    console.log(`  ✅ 일감 ${jobs.length}개 등록`)
  }

  // 4. 지원 + 배차 (settled 일감)
  console.log('\n── 지원 및 배차')
  const settledJobs = jobs.filter(j => j.status === 'settled')

  // driver1(최민준): 008 일감 5개 배차 → 인증뱃지용
  // driver3(강태양): 3w 일감 2개 배차 → 부정뱃지용
  const driver1 = drivers[0] // 최민준 - 008
  const driver3 = drivers[2] // 강태양 - 3w

  const jobs008 = settledJobs.filter(j => j.equipment_codes.includes('008'))
  const jobs3w  = settledJobs.filter(j => j.equipment_codes.includes('3w'))

  async function ensureApplication(jobId: string, driverId: string, eqCode: string, equipments: { id: string; model_code: string }[]) {
    const { data: existing } = await admin.from('applications').select('id').eq('job_id', jobId).eq('driver_id', driverId)
    if (existing && existing.length > 0) return
    const eq = equipments.find(e => e.model_code === eqCode)
    await admin.from('applications').insert({
      job_id: jobId, driver_id: driverId,
      equipment_id: eq?.id ?? null,
      status: 'accepted', applied_equipment_code: eqCode,
    })
  }

  for (const job of jobs008) {
    await ensureApplication(job.id, driver1.id, '008', driver1.equipments)
  }
  for (const job of jobs3w) {
    await ensureApplication(job.id, driver3.id, '3w', driver3.equipments)
  }

  // open 일감 pending 지원
  const openJobs = jobs.filter(j => j.status === 'open')
  for (const job of openJobs.slice(0, 4)) {
    const code = job.equipment_codes[0]
    const matched = drivers.filter(d => d.equipments.some(e => e.model_code === code))
    for (const driver of matched.slice(0, 2)) {
      const eq = driver.equipments.find(e => e.model_code === code)
      const { data: ex } = await admin.from('applications').select('id').eq('job_id', job.id).eq('driver_id', driver.id)
      if (ex && ex.length > 0) continue
      await admin.from('applications').insert({
        job_id: job.id, driver_id: driver.id,
        equipment_id: eq?.id ?? null,
        status: 'pending', applied_equipment_code: code,
      })
    }
  }
  console.log('  ✅ 배차 및 지원 완료')

  // 5. 리뷰
  console.log('\n── 리뷰 등록')

  // driver1(최민준) — 높은 평점 5개 → 인증뱃지 (avg 4.5+, 5건)
  const highRatings = [5, 5, 5, 4, 5]
  for (let i = 0; i < jobs008.length && i < 5; i++) {
    const job = jobs008[i]
    const { data: ex } = await admin.from('reviews').select('id').eq('job_id', job.id).eq('reviewee_id', driver1.id)
    if (ex && ex.length > 0) continue
    await admin.from('reviews').insert({
      job_id: job.id, reviewer_id: job.manager_id, reviewee_id: driver1.id,
      rating: highRatings[i],
      comment: ['작업이 깔끔하고 시간 약속도 정확합니다. 다음에도 함께하고 싶습니다.','경험이 많아서 현장 적응이 빠르고 안전의식이 높습니다.','꼼꼼하게 마무리까지 잘 해줬습니다. 적극 추천합니다.','소통이 잘 되고 현장 상황 대처 능력이 뛰어납니다.','항상 믿고 맡길 수 있는 기사님입니다.'][i],
    })
    await admin.from('reviews').insert({
      job_id: job.id, reviewer_id: driver1.id, reviewee_id: job.manager_id,
      rating: 5, comment: '설명이 명확하고 지급도 약속대로 해주셨습니다.',
    })
  }

  // driver3(강태양) — 낮은 평점 → 부정뱃지 (avg 2.0 이하)
  const lowRatings = [2, 1, 2, 1]
  for (let i = 0; i < jobs3w.length && i < lowRatings.length; i++) {
    const job = jobs3w[i]
    const { data: ex } = await admin.from('reviews').select('id').eq('job_id', job.id).eq('reviewee_id', driver3.id)
    if (ex && ex.length > 0) continue
    await admin.from('reviews').insert({
      job_id: job.id, reviewer_id: job.manager_id, reviewee_id: driver3.id,
      rating: lowRatings[i],
      comment: ['작업 마무리가 아쉬웠습니다.','시간 약속이 지켜지지 않아 현장 일정에 차질이 생겼습니다.','장비 상태 확인 없이 와서 당일 지연됐습니다.','소통이 잘 안 됐습니다.'][i],
    })
  }
  console.log('  ✅ 리뷰 등록 완료')

  // 6. 평점 수동 업데이트
  console.log('\n── 프로필 평점 갱신')

  // driver1 인증뱃지
  const d1AvgRating = highRatings.reduce((a, b) => a + b, 0) / highRatings.length
  await admin.from('profiles').update({
    rating_avg: Math.round(d1AvgRating * 10) / 10,
    review_count: highRatings.length,
    is_certified: d1AvgRating >= 4.5 && highRatings.length >= 5,
  }).eq('id', driver1.id)
  console.log(`  ✅ ${driver1.name} — 평점 ${d1AvgRating.toFixed(1)}, 인증뱃지 부여`)

  // driver3 부정뱃지
  const validLow = lowRatings.slice(0, jobs3w.length)
  const d3AvgRating = validLow.length > 0 ? validLow.reduce((a, b) => a + b, 0) / validLow.length : 0
  await admin.from('profiles').update({
    rating_avg: Math.round(d3AvgRating * 10) / 10,
    review_count: validLow.length,
    is_certified: false,
  }).eq('id', driver3.id)
  console.log(`  ✅ ${driver3.name} — 평점 ${d3AvgRating.toFixed(1)}, 부정뱃지 조건`)

  // manager1 인증뱃지 (기사들한테 리뷰 받은 것 기반)
  await admin.from('profiles').update({
    rating_avg: 4.8, review_count: 5, is_certified: true,
  }).eq('id', managerIds[0])
  console.log(`  ✅ ${MANAGERS[0].name} — 평점 4.8, 인증뱃지 부여`)

  // 7. 채팅
  console.log('\n── 채팅 등록')

  for (let i = 0; i < Math.min(openJobs.length, 3); i++) {
    const job = openJobs[i]
    const managerId = job.manager_id
    const driver = drivers[i % drivers.length]
    const script = CHAT_SCRIPTS[i % CHAT_SCRIPTS.length]

    const { data: existingRoom } = await admin.from('chat_rooms')
      .select('id').eq('job_id', job.id).eq('driver_id', driver.id)
    if (existingRoom && existingRoom.length > 0) continue

    const { data: room, error: roomErr } = await admin.from('chat_rooms').insert({
      job_id: job.id, manager_id: managerId, driver_id: driver.id,
      manager_left: false, driver_left: false,
    }).select('id').single()
    if (roomErr) { console.error('채팅방 오류:', roomErr.message); continue }

    const messages = script.map((line, idx) => ({
      room_id: room.id,
      sender_id: line.from === 'manager' ? managerId : driver.id,
      message: line.text,
      is_read: true,
      is_deleted: false,
      created_at: new Date(Date.now() - (script.length - idx) * 60000).toISOString(),
    }))
    await admin.from('chat_messages').insert(messages)
    console.log(`  ✅ 채팅방 생성 — ${job.title.slice(0, 18)}... (${script.length}개 메시지)`)
  }

  // ── 완료 요약 ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('✅ 시드 완료!')
  console.log('\n📋 테스트 계정 (비밀번호: Diggo1234!)\n')
  console.log('  소장')
  MANAGERS.forEach(m => console.log(`    ${m.email}  (${m.name})`))
  console.log('\n  기사')
  DRIVERS.forEach(d => console.log(`    ${d.email}  (${d.name})`))
  console.log('\n🏅 뱃지')
  console.log(`  인증뱃지: ${DRIVERS[0].name}(driver1), ${MANAGERS[0].name}(manager1)`)
  console.log(`  부정뱃지: ${DRIVERS[2].name}(driver3) — 평점 ${(lowRatings.reduce((a,b)=>a+b,0)/lowRatings.length).toFixed(1)}`)
}

run().catch(e => { console.error('❌ 시드 실패:', e.message ?? e); process.exit(1) })
