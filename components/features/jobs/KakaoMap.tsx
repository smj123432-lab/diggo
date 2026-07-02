'use client'

// 카카오맵 SDK로 좌표 기반 지도 렌더링 — IntersectionObserver로 뷰포트 진입 시 스크립트 로드
import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown
        LatLng: new (lat: number, lng: number) => unknown
        Marker: new (options: { position: unknown }) => { setMap: (map: unknown) => void }
      }
    }
  }
}

interface Props {
  latitude: number
  longitude: number
  label?: string
}

export function KakaoMap({ latitude, longitude, label }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  // 뷰포트 진입 시에만 카카오맵 스크립트 로드 (초기 LCP/TBT 감소)
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY
    if (!appKey || !containerRef.current) return

    const scriptId = 'kakao-map-sdk'

    function initMap() {
      window.kakao.maps.load(() => {
        if (!containerRef.current) return
        const center = new window.kakao.maps.LatLng(latitude, longitude)
        const map = new window.kakao.maps.Map(containerRef.current, { center, level: 4 })
        const marker = new window.kakao.maps.Marker({ position: center })
        marker.setMap(map)
      })
    }

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      if (window.kakao) { initMap() } else { existing.addEventListener('load', initMap) }
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.onload = initMap
    document.head.appendChild(script)
  }, [visible, latitude, longitude])

  return (
    // 고정 높이로 CLS 방지 — 지도가 로드되기 전에도 공간을 확보
    <div ref={wrapperRef} className="mt-3 rounded-xl overflow-hidden border border-gray-100" style={{ height: '176px' }}>
      <div ref={containerRef} className="w-full h-44 bg-gray-100">
        {!visible && <div className="w-full h-full bg-gray-100 animate-pulse" />}
      </div>
      {label && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">{label}</p>
        </div>
      )}
    </div>
  )
}
