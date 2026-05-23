export type UserRole = 'driver' | 'manager' | 'admin'

export type EquipmentCode = '008' | '017' | '035' | '02' | '3w' | '6w' | '8w' | '10t'

export type JobType = 'civil' | 'demolition'

export type JobStatus = 'open' | 'closed' | 'in_progress' | 'completed'

export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected'

// 지급 예정일 유형
export type PayDueType = 'same_day' | 'd3' | 'd7' | 'd14' | 'd30'

// 작업 기간 유형
export type WorkDuration = 'day_1' | 'day_2_3' | 'week_1' | 'week_2' | 'month_1plus'

export type CertificationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  name: string
  role: UserRole
  phone: string | null
  experience_years: number | null
  garage_address: string | null
  latitude: number | null
  longitude: number | null
  rating_avg: number
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
  equipment_code: EquipmentCode
  description: string
  attachments: string | null
  caution: string | null
  location: string
  latitude: number | null
  longitude: number | null
  pay_amount: number
  work_date: string
  work_duration: WorkDuration | null
  pay_due_type: PayDueType
  pay_due_date: string | null
  status: JobStatus
  created_at: string
}

export interface JobWithManager extends Job {
  profiles: Pick<Profile, 'id' | 'name' | 'rating_avg' | 'is_certified'>
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
  jobs: Pick<Job, 'id' | 'title' | 'work_date' | 'pay_amount' | 'location'>
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

export interface Chat {
  id: string
  job_id: string
  application_id: string
  created_at: string
}

export interface ChatWithDetails extends Chat {
  jobs: Pick<Job, 'id' | 'title'>
  applications: Pick<Application, 'id' | 'driver_id' | 'status'>
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  is_read: boolean
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
  '008': '008 (미니)',
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
  day_1: '하루',
  day_2_3: '2~3일',
  week_1: '일주일',
  week_2: '2주',
  month_1plus: '한달 이상',
}

export const WORK_DURATION_LIST: WorkDuration[] = ['day_1', 'day_2_3', 'week_1', 'week_2', 'month_1plus']

// 일감 상태 한글 레이블
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: '모집중',
  closed: '마감',
  in_progress: '작업중',
  completed: '완료',
}

// 지원 상태 한글 레이블
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '지원완료',
  reviewing: '검토중',
  accepted: '수락',
  rejected: '거절',
}
