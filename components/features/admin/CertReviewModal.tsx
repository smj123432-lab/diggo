'use client'

// 기사별 인증 서류 검토 모달 — 서류 이미지 확인 + 승인/거절
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const CERT_TYPE_LABELS: Record<string, string> = {
  license: '면허증',
  safety_education: '안전교육 이수증',
}

interface Cert {
  id: string
  cert_type: string
  image_url: string
  status: string
}

interface Props {
  driverName: string
  driverEmail: string
  driverPhone: string
  certs: Cert[]
  onClose: () => void
}

export function CertReviewModal({ driverName, driverEmail, driverPhone, certs, onClose }: Props) {
  const [localCerts, setLocalCerts] = useState(certs)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleAction(certId: string, action: 'approved' | 'rejected') {
    setLoadingId(certId)
    try {
      const res = await fetch(`/api/admin/certifications/${certId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '처리 실패')
      setLocalCerts(prev => prev.map(c => c.id === certId ? { ...c, status: action } : c))
      toast.success(action === 'approved' ? '승인되었습니다.' : '거절되었습니다.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '처리에 실패했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  const displayName = driverName || driverEmail

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-400">{driverPhone || '번호 미등록'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 서류 목록 */}
        <div className="px-6 py-5 space-y-4">
          {localCerts.map(cert => (
            <div key={cert.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  {CERT_TYPE_LABELS[cert.cert_type] ?? cert.cert_type}
                </span>
                {cert.status === 'approved' && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">승인됨</span>
                )}
                {cert.status === 'rejected' && (
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">거절됨</span>
                )}
                {cert.status === 'pending' && (
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">검토중</span>
                )}
              </div>
              <a href={cert.image_url} target="_blank" rel="noreferrer" className="block">
                <img
                  src={cert.image_url}
                  alt="서류 이미지"
                  className="w-full h-52 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                />
              </a>
              {cert.status === 'pending' && (
                <div className="px-4 py-3 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    onClick={() => handleAction(cert.id, 'rejected')}
                    disabled={!!loadingId}
                    className="text-xs font-bold px-4 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {loadingId === cert.id ? '처리중...' : '거절'}
                  </button>
                  <button
                    onClick={() => handleAction(cert.id, 'approved')}
                    disabled={!!loadingId}
                    className="text-xs font-bold px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loadingId === cert.id ? '처리중...' : '승인'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
