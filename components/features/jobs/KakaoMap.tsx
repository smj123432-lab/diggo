'use client'

// 카카오맵 SDK로 좌표 기반 지도 렌더링
import { useEffect, useRef } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

    if (document.getElementById(scriptId)) {
      initMap()
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.onload = initMap
    document.head.appendChild(script)
  }, [latitude, longitude])

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
      <div ref={containerRef} className="w-full h-44" />
      {label && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">{label}</p>
        </div>
      )}
    </div>
  )
}
