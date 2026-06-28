'use client'

// 알림 설정 모달 — 알림 유형별 on/off (localStorage 저장)
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const KEYS = [
  { key: 'new_application',      label: '새 지원자 알림',      desc: '기사가 내 일감에 지원할 때' },
  { key: 'application_accepted', label: '지원 수락 알림',      desc: '소장이 내 지원을 수락할 때' },
  { key: 'application_rejected', label: '지원 거절 알림',      desc: '소장이 내 지원을 거절할 때' },
  { key: 'application_cancelled',label: '배차 취소 알림',      desc: '상대방이 배차를 취소할 때' },
] as const

const STORAGE_KEY = 'diggo:notification_settings'

function loadSettings(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, boolean>
  } catch {}
  return Object.fromEntries(KEYS.map(k => [k.key, true]))
}

function saveSettings(settings: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch {}
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationSettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (open) setSettings(loadSettings()) }, [open])

  function toggle(key: string) {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] }
      saveSettings(next)
      return next
    })
  }

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">알림 설정</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {KEYS.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4 ${
                  settings[key] ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={settings[key]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    settings[key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">설정은 이 기기에만 적용됩니다.</p>
      </div>
    </div>,
    document.body
  )
}
