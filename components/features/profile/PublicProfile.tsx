'use client'

// 공개 프로필 페이지 — 소장/기사 역할별 분기 UI
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Award, Briefcase, MapPin, Calendar, ChevronRight, AlertTriangle } from 'lucide-react'
import type { Profile, Job, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, JOB_TYPE_LABELS } from '@/types'
import { formatFullDate, formatWorkDate } from '@/lib/utils/date'

interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_name: string | null
  job_title: string | null
}

interface Props {
  profile: Pick<Profile, 'id' | 'name' | 'role' | 'bio' | 'avatar_url' | 'rating_avg' | 'review_count' | 'is_certified' | 'experience_years' | 'penalty_count'>
  reviews: ReviewItem[]
  openJobs: Pick<Job, 'id' | 'title' | 'work_date' | 'location' | 'equipment_codes' | 'job_type'>[]
  matchCount: number
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function DefaultAvatar({ name }: { name: string }) {
  const initial = name.charAt(0)
  return (
    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-2xl font-bold">
      {initial}
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const date = formatFullDate(review.created_at)

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {review.reviewer_name ?? '(알 수 없음)'}
          </span>
          {review.job_title && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">· {review.job_title}</span>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">{date}</span>
      </div>
      <StarRating rating={review.rating} />
      {review.comment && (
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  )
}

function JobCard({ job }: { job: Props['openJobs'][number] }) {
  const workDate = formatWorkDate(job.work_date)
  const eqLabels = (job.equipment_codes as EquipmentCode[])
    .map((c) => EQUIPMENT_LABELS[c])
    .join(' · ')

  return (
    <Link href={`/jobs/${job.id}`} className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              {job.location}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3 shrink-0" />
              {workDate}
            </span>
            {eqLabels && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Briefcase className="w-3 h-3 shrink-0" />
                {eqLabels}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      </div>
      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600">
        {JOB_TYPE_LABELS[job.job_type]}
      </span>
    </Link>
  )
}

export default function PublicProfile({ profile, reviews, openJobs, matchCount }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'jobs' | 'reviews'>('jobs')
  const isManager = profile.role === 'manager'
  const isVeteran = profile.rating_avg >= 4.5 && profile.review_count >= 5
  const isLowRating = profile.review_count >= 5 && profile.rating_avg <= 2.0
  const hasPenalty = (profile.penalty_count ?? 0) > 0

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 뒤로가기 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
            aria-label="뒤로가기"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-700">프로필</span>
        </div>
      </div>

      {/* 헤더 카드 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultAvatar name={profile.name} />
              )}
            </div>

            {/* 이름 + 뱃지 + 요약 */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  {profile.name} {isManager ? '소장' : '기사'}
                </h1>
                {isVeteran && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white">
                    <Award className="w-3 h-3" />
                    우수 베테랑
                  </span>
                )}
                {isLowRating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                    <AlertTriangle className="w-3 h-3" />
                    저평점 주의
                  </span>
                )}
                {hasPenalty && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-200">
                    <AlertTriangle className="w-3 h-3" />
                    패널티 {profile.penalty_count}회
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{profile.bio}</p>
              )}

              {/* 통계 요약 */}
              <div className="flex flex-wrap items-center gap-3">
                {profile.review_count > 0 ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-slate-800">{profile.rating_avg.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({profile.review_count})</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">평가 없음</span>
                )}
                <span className="text-gray-200 text-xs">|</span>
                <span className="text-xs text-gray-500">매칭 {matchCount}회</span>
                {!isManager && profile.experience_years != null && (
                  <>
                    <span className="text-gray-200 text-xs">|</span>
                    <span className="text-xs text-gray-500">경력 {profile.experience_years}년</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 역할별 본문 */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        {isManager ? (
          /* ── 소장: 탭 분기 ── */
          <>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'jobs'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-gray-500 hover:text-slate-700'
                }`}
              >
                모집중 일감 {openJobs.length > 0 && `(${openJobs.length})`}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'reviews'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-gray-500 hover:text-slate-700'
                }`}
              >
                받은 평가 {reviews.length > 0 && `(${reviews.length})`}
              </button>
            </div>

            {activeTab === 'jobs' ? (
              openJobs.length === 0 ? (
                <div className="text-center py-14 text-gray-400 text-sm">
                  현재 모집중인 일감이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {openJobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              )
            ) : (
              reviews.length === 0 ? (
                <div className="text-center py-14 text-gray-400 text-sm">
                  아직 받은 평가가 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              )
            )}
          </>
        ) : (
          /* ── 기사: 받은 평가 목록만 ── */
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">받은 평가</p>
            {reviews.length === 0 ? (
              <div className="text-center py-14 text-gray-400 text-sm">
                아직 받은 평가가 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
