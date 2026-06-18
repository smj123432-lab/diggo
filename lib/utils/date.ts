// 날짜 포맷 유틸 — toISOString()은 UTC 변환으로 KST 자정에 하루 차이가 발생하므로
// 클라이언트 코드에서 오늘 날짜가 필요할 때는 getTodayStr()을,
// 서버(API Route, 서버 컴포넌트, 캐시 함수)에서는 getServerTodayStr()을 사용한다.

/** KST 기준 오늘 날짜 (YYYY-MM-DD) — 클라이언트용 */
export function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** KST 기준 오늘 날짜 (YYYY-MM-DD) — 서버용 (API Route, 서버 컴포넌트, 캐시 함수). Vercel은 UTC 동작이므로 +9h 보정. */
export function getServerTodayStr(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

/** 작업일: "6/15(일)" */
export function formatWorkDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric', weekday: 'short',
  })
}

/** 월/일: "6/15" */
export function formatMonthDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric',
  })
}

/** 긴 월/일: "6월 15일" */
export function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric',
  })
}

/** 전체 날짜: "2026년 6월 15일" */
export function formatFullDate(date: string | Date): string {
  return (typeof date === 'string' ? new Date(date) : date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

/** 연도 포함 작업일: "2026년 6월 15일(일)" */
export function formatWorkDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}
