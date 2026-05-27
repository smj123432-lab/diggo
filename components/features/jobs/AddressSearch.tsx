'use client'

// 카카오 로컬 API 기반 주소 검색 — /api/address/search 프록시 사용
import { useState, useRef, useEffect } from 'react'

interface AddressResult {
  address_name: string
  latitude: number
  longitude: number
}

interface AddressSearchProps {
  onSelect: (result: AddressResult) => void
  onClose: () => void
}

interface KakaoDocument {
  address_name: string
  address_type?: string
  x: string  // 경도
  y: string  // 위도
  place_name?: string
  road_address?: { address_name: string } | null
  address?: { address_name: string } | null
}

export function AddressSearch({ onSelect, onClose }: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const search = async () => {
    const q = query.trim()
    if (!q) return
    setIsLoading(true)
    setHasSearched(true)
    try {
      const res = await fetch(`/api/address/search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.documents ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') search()
  }

  const handleSelect = (doc: KakaoDocument) => {
    const addressName =
      doc.road_address?.address_name ||
      doc.address?.address_name ||
      doc.place_name ||
      doc.address_name

    onSelect({
      address_name: addressName,
      latitude: parseFloat(doc.y),
      longitude: parseFloat(doc.x),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-900">작업 주소 검색</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="도로명, 지번, 건물명으로 검색"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              onClick={search}
              disabled={isLoading}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  검색중
                </span>
              ) : '검색'}
            </button>
          </div>
        </div>

        {/* 결과 목록 */}
        <div className="overflow-y-auto flex-1">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-10 h-10 mb-3 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p className="text-sm">주소를 입력하고 검색해 주세요</p>
            </div>
          )}

          {hasSearched && !isLoading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm">검색 결과가 없습니다</p>
              <p className="text-xs mt-1">다른 검색어로 시도해 보세요</p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-gray-50">
              {results.map((doc, i) => {
                const mainAddress =
                  doc.road_address?.address_name ||
                  doc.address?.address_name ||
                  doc.address_name
                const subAddress =
                  doc.place_name ||
                  (doc.road_address?.address_name && doc.address?.address_name) ||
                  null

                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => handleSelect(doc)}
                      className="w-full text-left px-5 py-3.5 hover:bg-blue-50 transition-colors"
                    >
                      {doc.place_name && (
                        <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">{doc.place_name}</p>
                      )}
                      <p className="text-sm text-gray-700 truncate">{mainAddress}</p>
                      {subAddress && subAddress !== mainAddress && !doc.place_name && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{subAddress}</p>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
