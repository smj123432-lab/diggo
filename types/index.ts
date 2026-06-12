export type UserRole = 'driver' | 'manager' | 'admin'

export type EquipmentCode = '008' | '017' | '035' | '02' | '3w' | '6w' | '8w' | '10t'

export type JobType = 'civil' | 'demolition'

export type JobStatus = 'open' | 'closed' | 'in_progress' | 'completed' | 'settled'

export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected'

// 지급 예정일 유형
export type PayDueType = 'same_day' | 'd3' | 'd7' | 'd14' | 'd30'

// 작업 기간 유형
export type WorkDuration = 'half_day' | 'day_1' | 'week_1' | 'week_2' | 'week_3' | 'month_1' | 'month_1plus'

export type CertificationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  name: string
  role: UserRole
  phone: string | null
  bio: string | null
  avatar_url: string | null
  experience_years: number | null
  garage_address: string | null
  latitude: number | null
  longitude: number | null
  rating_avg: number
  review_count: number
  is_certified: boolean
  preferred_job_types: JobType[]
  preferred_equipment_codes: EquipmentCode[]
  preferred_regions: string[]
  created_at: string
}

export interface Equipment {
  id: string
  owner_id: string
  assigned_driver_id: string | null
  type: string
  model_code: EquipmentCode
  license_number: string | null
  created_at: string
}

export interface Job {
  id: string
  manager_id: string
  title: string
  job_type: JobType
  equipment_codes: EquipmentCode[]
  description: string
  attachments: string | null
  caution: string | null
  location: string
  latitude: number | null
  longitude: number | null
  pay_amounts: Record<string, number>  // { "008": 500000, "035": 800000 }
  work_days: Record<string, number>   // { "008": 1, "035": 3 }
  work_date: string
  work_duration: WorkDuration | null
  pay_due_type: PayDueType
  pay_due_date: string | null
  status: JobStatus
  created_at: string
}

export interface JobWithManager extends Job {
  profiles: Pick<Profile, 'id' | 'name' | 'rating_avg' | 'is_certified' | 'avatar_url'>
}

// equipment_codes 배열을 레이블 문자열로 변환
export function formatEquipmentCodes(codes: EquipmentCode[]): string {
  return codes.map(c => EQUIPMENT_LABELS[c]).join(' · ')
}

// pay_amounts 객체를 카드용 표시 문자열로 변환 (단일: 그대로 / 복수: min~max)
export function formatPayAmounts(amounts: Record<string, number>): string {
  const values = Object.values(amounts)
  if (values.length === 0) return '0'
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return min.toLocaleString()
  return `${min.toLocaleString()}~${max.toLocaleString()}`
}

export interface Application {
  id: string
  job_id: string
  driver_id: string
  equipment_id: string | null
  status: ApplicationStatus
  applied_at: string
}

export interface ApplicationWithDetails extends Application {
  profiles: Pick<Profile, 'id' | 'name' | 'rating_avg' | 'is_certified' | 'experience_years'>
  equipments: Pick<Equipment, 'id' | 'model_code' | 'license_number'> | null
  jobs: Pick<Job, 'id' | 'title' | 'work_date' | 'pay_amounts' | 'location'>
}

export interface LedgerExpense {
  id: string
  driver_id: string
  job_id: string | null
  expense_date: string
  category: string
  memo: string | null
  amount: number
  created_at: string
}

// 장부 수입 항목 (기사: accepted application → job)
export interface LedgerIncomeEntry {
  type: 'income'
  date: string            // YYYY-MM-DD
  jobId: string
  title: string
  location: string
  equipmentCode: EquipmentCode | null
  amount: number
  payDueType: PayDueType
  jobStatus: JobStatus
  dayIndex: number        // 1-based (1 = 작업 첫째 날)
  totalWorkDays: number   // 해당 장비 총 작업 일수
}

// 장부 지출 항목 (ledger_expenses)
export interface LedgerExpenseEntry {
  type: 'expense'
  date: string            // YYYY-MM-DD
  id: string
  category: string
  memo: string | null
  amount: number
}

// 장부 필터 탭
export type LedgerFilterTab = 'all' | 'pending' | 'settled'

// 소장 현장 항목 (장비별 × 날짜별 — work_date + n일)
export interface LedgerJobEntry {
  type: 'job'
  date: string            // YYYY-MM-DD (실제 작업 날짜)
  jobId: string
  title: string
  location: string
  equipmentCode: EquipmentCode    // 해당 날짜의 장비 코드
  dailyAmount: number             // 해당 장비의 일당
  jobStatus: JobStatus
  dayIndex: number        // 1-based (1 = 작업 첫째 날)
  totalWorkDays: number   // 해당 장비 총 작업 일수
}

export type LedgerEntry = LedgerIncomeEntry | LedgerExpenseEntry | LedgerJobEntry

// 특정 날짜의 모든 장부 항목
export interface LedgerDayData {
  date: string
  incomes: LedgerIncomeEntry[]
  expenses: LedgerExpenseEntry[]
  jobs: LedgerJobEntry[]
  totalIncome: number
  totalExpense: number
}

// 월 전체 장부 데이터
export interface LedgerMonthData {
  year: number
  month: number
  days: Record<string, LedgerDayData>  // 'YYYY-MM-DD' → LedgerDayData
  totalIncome: number      // 정산완료 + 정산대기 합산
  totalIncomeCount: number // 수입 일감 건수
  pendingIncome: number    // 정산대기(completed) 금액
  settledIncome: number    // 정산완료(settled) 금액
  totalExpense: number
  netIncome: number
  totalJobCount: number        // 소장용
  totalJobPayAmount: number    // 소장용: 일감 일당 합산
  totalManagerExpense: number  // 소장용: 일당 + 수동 지출 합산
  totalManualExpense: number   // 소장용: 수동 지출 합산
}

export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ReviewWithReviewer extends Review {
  profiles: Pick<Profile, 'id' | 'name' | 'role'>
}

export interface Certification {
  id: string
  driver_id: string
  cert_type: string
  image_url: string
  status: CertificationStatus
  verified_at: string | null
  created_at: string
}

export interface ChatRoom {
  id: string
  job_id: string
  manager_id: string
  driver_id: string
  manager_left: boolean
  driver_left: boolean
  created_at: string
}

export interface ChatRoomWithDetails extends ChatRoom {
  jobs: Pick<Job, 'id' | 'title' | 'work_date' | 'equipment_codes'>
  manager: Pick<Profile, 'id' | 'name' | 'avatar_url'>
  driver: Pick<Profile, 'id' | 'name' | 'avatar_url'>
  last_message?: ChatMessage | null
  unread_count?: number
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  message: string
  is_read: boolean
  is_deleted: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

// 장비 코드 / 일감 유형 순서 배열 (필터 UI 순서 고정)
export const EQUIPMENT_CODES_LIST: EquipmentCode[] = ['008', '017', '035', '02', '3w', '6w', '8w', '10t']
export const JOB_TYPES_LIST: JobType[] = ['civil', 'demolition']

// 장비 코드 한글 레이블
export const EQUIPMENT_LABELS: Record<EquipmentCode, string> = {
  '008': '008',
  '017': '017',
  '035': '035',
  '02': '02',
  '3w': '3w (휠)',
  '6w': '6w (휠)',
  '8w': '8w (휠)',
  '10t': '10t',
}

// 일감 유형 한글 레이블
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  civil: '일반 토목',
  demolition: '철거',
}

// 지급 예정일 한글 레이블
export const PAY_DUE_LABELS: Record<PayDueType, string> = {
  same_day: '당일 지급',
  d3: '3일 후 지급',
  d7: '7일 후 지급',
  d14: '14일 후 지급',
  d30: '30일 후 지급',
}

export const PAY_DUE_TYPES_LIST: PayDueType[] = ['same_day', 'd3', 'd7', 'd14', 'd30']

// 작업 기간 한글 레이블
export const WORK_DURATION_LABELS: Record<WorkDuration, string> = {
  half_day: '반나절',
  day_1: '하루',
  week_1: '1주일 이내',
  week_2: '2주일 이내',
  week_3: '3주일 이내',
  month_1: '한달 이내',
  month_1plus: '한달 이상',
}

export const WORK_DURATION_LIST: WorkDuration[] = ['half_day', 'day_1', 'week_1', 'week_2', 'week_3', 'month_1', 'month_1plus']

// 일감 상태 한글 레이블
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: '모집중',
  closed: '마감',
  in_progress: '작업중',
  completed: '작업완료',
  settled: '정산완료',
}

// 지원 상태 한글 레이블
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '지원완료',
  reviewing: '검토중',
  accepted: '수락',
  rejected: '거절',
}

// 지출 카테고리 (기사·소장 공용)
export const LEDGER_EXPENSE_CATEGORIES = [
  '주유비',
  '식대',
  '공구·소모품',
  '수리비',
  '현장경비',
  '통신비',
  '기타',
] as const

export type LedgerExpenseCategory = typeof LEDGER_EXPENSE_CATEGORIES[number]
