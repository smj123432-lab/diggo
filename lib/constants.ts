// 앱 전역 상수 — 서버/클라이언트 모두 import 가능한 순수 상수 파일

// ─── 일감 목록 페이지네이션 ───────────────────────────────────────────────
/** 첫 페이지 로드 개수 (SSR 프리페치 + 클라이언트 첫 fetch 공통) */
export const JOBS_FIRST_PAGE_LIMIT = 12

/** 두 번째 페이지부터 무한스크롤 fetch 개수 */
export const JOBS_NEXT_PAGE_LIMIT = 8

// ─── TanStack Query 기본 설정 ─────────────────────────────────────────────
/** QueryClient 기본 staleTime (ms) */
export const DEFAULT_STALE_TIME = 30 * 1000

// ─── 장부 룩백 기간 ───────────────────────────────────────────────────────
/** 다중 작업일 일감 조회를 위한 룩백 일수 (일감 시작일이 전달일 수 있음) */
export const LEDGER_LOOKBACK_DAYS = 31

// ─── 채팅 이미지 업로드 ───────────────────────────────────────────────────
/** 채팅 이미지 최대 파일 크기 (bytes) — 10MB */
export const CHAT_IMAGE_MAX_SIZE = 10 * 1024 * 1024

// ─── 금액 입력 제한 ───────────────────────────────────────────────────────
/** 금액 컬럼 int4 범위 내 최대 허용값 */
export const MAX_PAY_AMOUNT = 999_999_999
