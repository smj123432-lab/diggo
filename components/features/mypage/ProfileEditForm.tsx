'use client'

// 프로필 수정 폼 — 기본 정보 + 역할별 추가 정보
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile, EquipmentCode, JobType } from '@/types'
import { EQUIPMENT_CODES_LIST, EQUIPMENT_LABELS, JOB_TYPES_LIST, JOB_TYPE_LABELS } from '@/types'
import { AddressSearch } from '@/components/features/jobs/AddressSearch'
import { updateProfile } from '@/lib/api/profile'

interface Props {
  profile: Profile
}

export function ProfileEditForm({ profile }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showAddressSearch, setShowAddressSearch] = useState(false)

  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [experienceYears, setExperienceYears] = useState(
    profile.experience_years != null ? String(profile.experience_years) : ''
  )
  const [equipmentCodes, setEquipmentCodes] = useState<EquipmentCode[]>(
    profile.preferred_equipment_codes ?? []
  )
  const [jobTypes, setJobTypes] = useState<JobType[]>(
    profile.preferred_job_types ?? []
  )
  const [garageAddress, setGarageAddress] = useState(profile.garage_address ?? '')
  const [lat, setLat] = useState<number | null>(profile.latitude)
  const [lng, setLng] = useState<number | null>(profile.longitude)

  function toggleEquipment(code: EquipmentCode) {
    setEquipmentCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  function toggleJobType(type: JobType) {
    setJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('이름을 입력해 주세요.'); return }

    setIsLoading(true)
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      }
      if (profile.role === 'driver') {
        body.experience_years = experienceYears ? Number(experienceYears) : null
        body.preferred_equipment_codes = equipmentCodes
        body.preferred_job_types = jobTypes
      }
      if (profile.role === 'manager') {
        body.garage_address = garageAddress || null
        body.latitude = lat
        body.longitude = lng
      }

      await updateProfile(body)
      toast.success('프로필이 저장되었습니다.')
      router.push('/mypage')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800">기본 정보</p>

        <div>
          <label htmlFor="profile-name" className="block text-xs font-semibold text-gray-500 mb-1.5">이름</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="block text-xs font-semibold text-gray-500 mb-1.5">전화번호</label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          />
        </div>

        <div>
          <label htmlFor="profile-bio" className="block text-xs font-semibold text-gray-500 mb-1.5">한 줄 소개</label>
          <input
            id="profile-bio"
            type="text"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="나를 한 문장으로 소개해 보세요"
            maxLength={80}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          />
          <p className="text-right text-xs text-gray-300 mt-1">{bio.length}/80</p>
        </div>
      </div>

      {/* 기사 전용 */}
      {profile.role === 'driver' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-bold text-slate-800">기사 정보</p>

          <div>
            <label htmlFor="profile-experience" className="block text-xs font-semibold text-gray-500 mb-1.5">현장 경력 (년)</label>
            <input
              id="profile-experience"
              type="number"
              value={experienceYears}
              onChange={e => setExperienceYears(e.target.value)}
              min={0}
              max={50}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">선호 장비</label>
            <div className="grid grid-cols-4 gap-2">
              {EQUIPMENT_CODES_LIST.map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleEquipment(code)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    equipmentCodes.includes(code)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                  }`}
                >
                  {EQUIPMENT_LABELS[code]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">선호 일 종류</label>
            <div className="flex gap-2">
              {JOB_TYPES_LIST.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleJobType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                    jobTypes.includes(type)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                  }`}
                >
                  {JOB_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 소장 전용 */}
      {profile.role === 'manager' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-bold text-slate-800">소장 정보</p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">차고지 주소</label>
            <div className="flex gap-2">
              <div className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 min-h-[42px] flex items-center">
                {garageAddress
                  ? <span className="text-gray-800">{garageAddress}</span>
                  : <span className="text-gray-300">주소를 검색하세요</span>
                }
              </div>
              <button
                type="button"
                onClick={() => setShowAddressSearch(true)}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 rounded-xl transition-colors"
              >
                검색
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm disabled:opacity-50"
      >
        {isLoading ? '저장 중...' : '저장하기'}
      </button>

      {showAddressSearch && (
        <AddressSearch
          onSelect={({ address_name, latitude, longitude }) => {
            setGarageAddress(address_name)
            setLat(latitude)
            setLng(longitude)
            setShowAddressSearch(false)
          }}
          onClose={() => setShowAddressSearch(false)}
        />
      )}
    </form>
  )
}
