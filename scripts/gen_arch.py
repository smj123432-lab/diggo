#!/usr/bin/env python3
"""Diggo 전체 아키텍처 다이어그램 SVG 생성"""
import html
import os

def x(s):
    """XML 특수문자 이스케이프"""
    return html.escape(str(s), quote=False)

W, H = 2300, 1750
BG = "#0f172a"

# 색상 팔레트
C = {
    "client":   {"bg": "#1e293b", "border": "#3b82f6", "text": "#93c5fd", "label": "#bfdbfe"},
    "server":   {"bg": "#172033", "border": "#06b6d4", "text": "#67e8f9", "label": "#a5f3fc"},
    "supabase": {"bg": "#0f2318", "border": "#10b981", "text": "#6ee7b7", "label": "#a7f3d0"},
    "external": {"bg": "#1a1025", "border": "#a855f7", "text": "#d8b4fe", "label": "#e9d5ff"},
    "box":      {"bg": "#0f172a", "border": "#334155"},
    "arrow":    "#475569",
    "white":    "#f1f5f9",
    "muted":    "#64748b",
    "dim":      "#475569",
    "yellow":   {"bg": "#1a1200", "border": "#713f12", "label": "#fef08a", "text": "#fbbf24"},
}

def rect(px, py, pw, ph, rx=10, fill=None, stroke=None, sw=1.5):
    fill = fill or C["box"]["bg"]
    stroke = stroke or C["box"]["border"]
    return f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def txt(px, py, content, size=13, fill="#f1f5f9", anchor="middle", weight="normal", mono=False):
    family = "monospace" if mono else "sans-serif"
    return f'<text x="{px}" y="{py}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" font-family="{family}">{x(content)}</text>'

def sec_label(px, py, label, color):
    return txt(px, py, label, size=11, fill=color, anchor="middle", weight="bold")

def dashed(x1, y1, x2, y2, color="#334155"):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.5" stroke-dasharray="6,4"/>'

lines = []
# 화살표 마커 — defs 최상단에 한 번만 정의
MARKER = f'''<defs>
  <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="{C['arrow']}"/>
  </marker>
  <style><![CDATA[
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
    .mono {{ font-family: "SF Mono", "Fira Code", Consolas, monospace; }}
  ]]></style>
</defs>'''

# ─── 배경 ───────────────────────────────────────────────
lines.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
for i in range(0, W, 60):
    lines.append(f'<line x1="{i}" y1="0" x2="{i}" y2="{H}" stroke="#1e293b" stroke-width="0.4"/>')
for i in range(0, H, 60):
    lines.append(f'<line x1="0" y1="{i}" x2="{W}" y2="{i}" stroke="#1e293b" stroke-width="0.4"/>')

# ─── 헤더 ────────────────────────────────────────────────
lines.append(rect(0, 0, W, 68, rx=0, fill="#0f172a", stroke="#0f172a"))
lines.append(txt(W//2, 30, "DIGGO", size=30, fill="#f8fafc", weight="900"))
lines.append(txt(W//2, 54, "굴착기 배차 플랫폼 - 전체 아키텍처 (System Architecture)", size=14, fill="#64748b"))
lines.append(f'<line x1="40" y1="68" x2="{W-40}" y2="68" stroke="#1e293b" stroke-width="1"/>')

# ══════════════════════════════════════════════════════════
# LAYER 1: 브라우저 / 클라이언트 (y: 82-530)
# ══════════════════════════════════════════════════════════
CL = C["client"]
lines.append(rect(20, 82, W-40, 448, rx=12, fill=CL["bg"], stroke=CL["border"], sw=2))
lines.append(sec_label(W//2, 104, "BROWSER / CLIENT LAYER", CL["border"]))

# ── Pages ─────────────────────────────────────────────────
PX, PY, PW, PH = 40, 116, 575, 404
lines.append(rect(PX, PY, PW, PH, rx=8, fill="#0f172a", stroke="#1e3a8a"))
lines.append(txt(PX+PW//2, PY+19, "Pages (App Router)", size=12, fill=CL["label"], weight="bold"))

pages = [
    ("/(auth)/", "login / signup / find-password / reset-password"),
    ("/jobs/", "일감 목록 · 상세 · 등록 · 수정"),
    ("/manager/", "소장 전용 · 지원자 관리 · 수락"),
    ("/mypage/", "마이페이지 · 장부 · 지원내역 · 평가 · 인증"),
    ("/chats/", "채팅 목록 · 채팅방"),
    ("/admin/", "관리자 · 인증 심사"),
    ("/notifications/", "알림 목록"),
    ("/profiles/[id]", "공개 프로필"),
    ("/ (홈)", "랜딩 페이지"),
]
for i, (name, desc) in enumerate(pages):
    yy = PY + 36 + i * 41
    lines.append(rect(PX+12, yy, PW-24, 34, rx=5, fill="#1e293b", stroke="#1e3a8a"))
    lines.append(txt(PX+22, yy+15, name, size=10, fill="#7dd3fc", anchor="start", weight="bold", mono=True))
    lines.append(txt(PX+22+155, yy+15, desc, size=9.5, fill="#94a3b8", anchor="start"))

# ── State Management ──────────────────────────────────────
SX, SY, SW2, SH = 635, 116, 460, 404
lines.append(rect(SX, SY, SW2, SH, rx=8, fill="#0f172a", stroke="#1d4ed8"))
lines.append(txt(SX+SW2//2, SY+19, "State Management", size=12, fill=CL["label"], weight="bold"))

# Zustand block
lines.append(rect(SX+10, SY+30, SW2-20, 180, rx=6, fill="#0f2044", stroke="#2563eb"))
lines.append(txt(SX+SW2//2, SY+49, "Zustand", size=12, fill="#60a5fa", weight="bold"))
zustand_items = [
    ("store/auth.ts", "유저 세션, role, isLoading"),
    ("store/notifications.ts", "알림 카운트, 읽음 상태"),
    ("AuthInitializer", "onAuthStateChange 단일 구독"),
    ("useAuthStore()", "전역 세션 읽기 전용"),
    ("프로필 fetch", "세션 확인 후 백그라운드"),
]
for i, (k, v) in enumerate(zustand_items):
    yy = SY + 63 + i * 28
    lines.append(txt(SX+20, yy, k, size=10, fill="#93c5fd", anchor="start", mono=True))
    lines.append(txt(SX+20, yy+13, v, size=9, fill="#64748b", anchor="start"))

# TanStack Query block
lines.append(rect(SX+10, SY+218, SW2-20, 176, rx=6, fill="#0f2044", stroke="#2563eb"))
lines.append(txt(SX+SW2//2, SY+237, "TanStack Query v5", size=12, fill="#60a5fa", weight="bold"))
tq_items = [
    ("useJobs", "무한스크롤 · prefetchInfiniteQuery"),
    ("useLedger", "장부 월별 데이터 캐싱"),
    ("useNotifications", "알림 목록 구독"),
    ("staleTime: 30s", "gcTime: 5m"),
    ("낙관적 업데이트", "queryClient.setQueryData"),
]
for i, (k, v) in enumerate(tq_items):
    yy = SY + 252 + i * 27
    lines.append(txt(SX+20, yy, k, size=10, fill="#93c5fd", anchor="start", mono=True))
    lines.append(txt(SX+20+140, yy, "- " + v, size=9.5, fill="#64748b", anchor="start"))

# ── Components ────────────────────────────────────────────
CX2, CY2, CW3, CH3 = 1115, 116, 500, 404
lines.append(rect(CX2, CY2, CW3, CH3, rx=8, fill="#0f172a", stroke="#1d4ed8"))
lines.append(txt(CX2+CW3//2, CY2+19, "Components", size=12, fill=CL["label"], weight="bold"))

lines.append(rect(CX2+10, CY2+30, CW3-20, 225, rx=6, fill="#0f2044", stroke="#2563eb"))
lines.append(txt(CX2+CW3//2, CY2+49, "components/features/", size=11, fill="#60a5fa", weight="bold", mono=True))
feat_items = [
    "admin/  - 인증 심사 UI",
    "auth/   - AuthInitializer",
    "chat/   - ChatRoom, ChatList, ChatInput",
    "driver/ - DriverApplicationsList",
    "home/   - AnimatedFeatures",
    "jobs/   - JobCard, JobForm, JobFilter",
    "ledger/ - LedgerCalendar, DayPanel",
    "manager/ - 지원자 수락",
    "mypage/ - 프로필 편집",
    "notifications/ - 알림 아이템",
    "profile/ - ProfileCard, ReviewForm",
    "reviews/ - 평가 목록",
]
for i, item in enumerate(feat_items):
    yy = CY2 + 64 + i * 16
    lines.append(txt(CX2+20, yy, "· " + item, size=9, fill="#94a3b8", anchor="start"))

lines.append(rect(CX2+10, CY2+263, CW3-20, 131, rx=6, fill="#0f2044", stroke="#2563eb"))
lines.append(txt(CX2+CW3//2, CY2+282, "components/ui/", size=11, fill="#60a5fa", weight="bold", mono=True))
ui_items = ["Avatar", "CertBadge", "CopyButton", "EmptyState", "EquipmentBadge", "ExcavatorIcon", "RatingDisplay"]
for i, item in enumerate(ui_items):
    col = i % 2
    row = i // 2
    xx = CX2 + 20 + col * 240
    yy = CY2 + 298 + row * 22
    lines.append(txt(xx, yy, "· " + item, size=9.5, fill="#94a3b8", anchor="start"))

# ── 카카오맵 + Hooks ──────────────────────────────────────
KX, KY, KW2, KH = 1635, 116, 630, 200
lines.append(rect(KX, KY, KW2, KH, rx=8, fill=C["yellow"]["bg"], stroke=C["yellow"]["border"]))
lines.append(txt(KX+KW2//2, KY+19, "Kakao Map API (클라이언트)", size=12, fill=C["yellow"]["label"], weight="bold"))
kakao_items = [
    ("SDK 로드", "app/layout.tsx script 태그"),
    ("주소 검색", "/api/address/search (서버 프록시)"),
    ("지도 렌더링", "KakaoMap 컴포넌트 (jobs/[id])"),
    ("createPortal", "stacking context z-index 우회"),
]
for i, (k, v) in enumerate(kakao_items):
    yy = KY + 36 + i * 36
    lines.append(rect(KX+12, yy, KW2-24, 30, rx=4, fill="#1c1000", stroke="#78350f"))
    lines.append(txt(KX+22, yy+14, k, size=10, fill=C["yellow"]["text"], anchor="start", weight="bold"))
    lines.append(txt(KX+22+110, yy+14, v, size=9.5, fill="#92400e", anchor="start"))

HX, HY, HW2, HH2 = 1635, 326, 630, 194
lines.append(rect(HX, HY, HW2, HH2, rx=8, fill="#0f172a", stroke="#1d4ed8"))
lines.append(txt(HX+HW2//2, HY+19, "Custom Hooks", size=12, fill=CL["label"], weight="bold"))
hook_items = [
    ("useAuth", "Supabase 세션 구독 (AuthInitializer 전용)"),
    ("useJobs", "TQ 무한스크롤 일감 목록"),
    ("useJobForm", "일감 등록/수정 폼 상태"),
    ("useLedger", "장부 월별 데이터"),
    ("useNotifications", "실시간 알림 구독"),
    ("useHorizontalScroll", "장비 필터 스크롤"),
]
for i, (k, v) in enumerate(hook_items):
    yy = HY + 35 + i * 26
    lines.append(txt(HX+20, yy, k + "()", size=10, fill="#93c5fd", anchor="start", mono=True))
    lines.append(txt(HX+20+145, yy, "- " + v, size=9.5, fill="#64748b", anchor="start"))

# ── 화살표: Client -> Server ───────────────────────────────
for ax in [300, 850, 1350, 1950]:
    lines.append(dashed(ax, 530, ax, 574))
    lines.append(f'<polygon points="{ax-6},572 {ax+6},572 {ax},582" fill="{C["arrow"]}"/>')
lines.append(txt(W//2, 555, "HTTP 요청 (fetch / TanStack Query)  |  Supabase Realtime WebSocket", size=11, fill=C["muted"]))

# ══════════════════════════════════════════════════════════
# LAYER 2: NEXT.JS 16 / VERCEL (y: 590-1045)
# ══════════════════════════════════════════════════════════
SL = C["server"]
lines.append(rect(20, 590, W-40, 455, rx=12, fill=SL["bg"], stroke=SL["border"], sw=2))
lines.append(sec_label(W//2, 612, "NEXT.JS 16  -  VERCEL DEPLOY", SL["border"]))

# ── App Router / Cache Layer ──────────────────────────────
AX, AY, AW, AH = 40, 626, 700, 210
lines.append(rect(AX, AY, AW, AH, rx=8, fill="#0f1f2e", stroke="#0891b2"))
lines.append(txt(AX+AW//2, AY+19, "App Router + Cache Layer", size=12, fill=SL["label"], weight="bold"))
cache_items = [
    ("cacheComponents: true", "next.config.mjs (Next.js 16)"),
    ('"use cache"', "jobs-cache.ts 공개 데이터"),
    ("cacheLife('seconds')", "getCachedJobsFirstPage()"),
    ("cacheLife('minutes')", "getCachedJobDetail(id)"),
    ("cacheTag('jobs')", "revalidateTag('jobs', 'max')"),
    ("'use no-store'", "createClient() -> auto dynamic"),
    ("Suspense wrapper", "[id] 라우트 PPR 패턴"),
]
for i, (k, v) in enumerate(cache_items):
    yy = AY + 35 + i * 25
    lines.append(txt(AX+16, yy, "· " + k, size=10, fill="#22d3ee", anchor="start", mono=True))
    lines.append(txt(AX+16+222, yy, v, size=9.5, fill="#64748b", anchor="start"))

# ── Vercel 배포 정보 ──────────────────────────────────────
VX, VY, VW, VH = 40, 846, 700, 189
lines.append(rect(VX, VY, VW, VH, rx=8, fill="#0f1f2e", stroke="#0891b2"))
lines.append(txt(VX+VW//2, VY+19, "Vercel / 인프라 / 환경변수", size=12, fill=SL["label"], weight="bold"))
vercel_items = [
    ("main branch", "자동 배포 트리거"),
    ("NEXT_PUBLIC_SUPABASE_URL", "Supabase 공개 URL"),
    ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase 공개 키"),
    ("SUPABASE_SERVICE_ROLE_KEY", "admin 클라이언트 전용 (비공개)"),
    ("KAKAO_REST_API_KEY", "서버 전용 (NEXT_PUBLIC 없음)"),
]
for i, (k, v) in enumerate(vercel_items):
    yy = VY + 35 + i * 30
    lines.append(rect(VX+12, yy, VW-24, 25, rx=4, fill="#0a1628", stroke="#164e63"))
    lines.append(txt(VX+20, yy+13, k, size=10, fill="#67e8f9", anchor="start", mono=True))
    lines.append(txt(VX+20+260, yy+13, v, size=9.5, fill="#64748b", anchor="start"))

# ── API Routes ─────────────────────────────────────────────
RX2, RY2, RW2, RH2 = 760, 626, 900, 409
lines.append(rect(RX2, RY2, RW2, RH2, rx=8, fill="#0f1f2e", stroke="#0891b2"))
lines.append(txt(RX2+RW2//2, RY2+19, "API Routes  (app/api/)", size=12, fill=SL["label"], weight="bold"))

api_left = [
    ("/api/jobs", "목록 · 상세 · 내 일감"),
    ("/api/jobs/[id]", "CRUD · equipment-status"),
    ("/api/applications", "지원 · 수락 · 취소"),
    ("/api/chats", "채팅방 생성 · 목록"),
    ("/api/chats/[id]", "메시지 · 배차 · 퇴장"),
    ("/api/ledger/monthly", "월별 집계"),
    ("/api/ledger/daily/[date]", "일별 상세"),
    ("/api/ledger/expenses", "지출 CRUD"),
    ("/api/profile", "내 프로필 · 아바타"),
    ("/api/profiles/[id]", "공개 프로필"),
]
api_right = [
    ("/api/reviews", "평가 작성 · 목록"),
    ("/api/notifications", "알림 · 읽음 처리"),
    ("/api/admin/certifications", "인증 심사"),
    ("/api/auth/password", "비밀번호 변경"),
    ("/api/auth/reset-password", "이메일 재설정"),
    ("/api/address/search", "카카오 주소 프록시"),
    ("/api/certifications", "서류 업로드"),
    ("/api/certifications/signed-url", "Signed URL"),
    ("/api/equipments", "장비 목록"),
]
for i, (name, desc) in enumerate(api_left):
    yy = RY2 + 34 + i * 37
    lines.append(rect(RX2+10, yy, RW2//2-15, 31, rx=5, fill="#0a1628", stroke="#164e63"))
    lines.append(txt(RX2+18, yy+12, name, size=9.5, fill="#22d3ee", anchor="start", mono=True))
    lines.append(txt(RX2+18, yy+24, desc, size=8.5, fill="#64748b", anchor="start"))
for i, (name, desc) in enumerate(api_right):
    yy = RY2 + 34 + i * 41
    lines.append(rect(RX2+RW2//2+5, yy, RW2//2-15, 35, rx=5, fill="#0a1628", stroke="#164e63"))
    lines.append(txt(RX2+RW2//2+13, yy+13, name, size=9.5, fill="#22d3ee", anchor="start", mono=True))
    lines.append(txt(RX2+RW2//2+13, yy+26, desc, size=8.5, fill="#64748b", anchor="start"))

# ── Lib / Types / Store ────────────────────────────────────
LX2, LY2, LW2, LH2 = 1680, 626, 590, 409
lines.append(rect(LX2, LY2, LW2, LH2, rx=8, fill="#0f1f2e", stroke="#0891b2"))
lines.append(txt(LX2+LW2//2, LY2+19, "lib / types / store", size=12, fill=SL["label"], weight="bold"))
lib_items = [
    ("lib/supabase/client.ts", "createBrowserClient (CSR)"),
    ("lib/supabase/server.ts", "createServerClient 'use no-store'"),
    ("lib/supabase/admin.ts", "createAdminClient (SERVICE_ROLE)"),
    ("lib/utils/jobs-cache.ts", "'use cache' 공개 일감 SSR"),
    ("lib/utils/ledger.ts", "buildMonthData · buildIncomeEntries"),
    ("lib/utils/date.ts", "KST 날짜 포맷 헬퍼"),
    ("lib/utils/dispatch.ts", "배차 유틸"),
    ("lib/constants.ts", "EQUIPMENT_LABELS 등 상수"),
    ("types/index.ts", "Profile · Job · Application 타입"),
    ("store/auth.ts", "Zustand 인증 스토어"),
    ("store/notifications.ts", "Zustand 알림 스토어"),
]
for i, (k, v) in enumerate(lib_items):
    yy = LY2 + 35 + i * 35
    lines.append(rect(LX2+10, yy, LW2-20, 29, rx=5, fill="#0a1628", stroke="#164e63"))
    lines.append(txt(LX2+18, yy+11, k, size=9.5, fill="#67e8f9", anchor="start", mono=True))
    lines.append(txt(LX2+18, yy+24, v, size=9, fill="#64748b", anchor="start"))

# ── 화살표: Server -> Backend ─────────────────────────────
for ax in [300, 1000, 1800]:
    lines.append(dashed(ax, 1045, ax, 1089))
    lines.append(f'<polygon points="{ax-6},1087 {ax+6},1087 {ax},1097" fill="{C["arrow"]}"/>')
lines.append(txt(W//2, 1070, "Supabase SDK  |  REST API  |  Realtime WebSocket", size=11, fill=C["muted"]))

# ══════════════════════════════════════════════════════════
# LAYER 3: SUPABASE (y: 1104-1620)
# ══════════════════════════════════════════════════════════
DB = C["supabase"]
lines.append(rect(20, 1104, W-40, 600, rx=12, fill=DB["bg"], stroke=DB["border"], sw=2))
lines.append(sec_label(W//2, 1126, "SUPABASE  (BaaS Backend)", DB["border"]))

# ── Auth ───────────────────────────────────────────────────
AUX, AUY, AUW, AUH = 40, 1138, 395, 550
lines.append(rect(AUX, AUY, AUW, AUH, rx=8, fill="#071c0e", stroke="#059669"))
lines.append(txt(AUX+AUW//2, AUY+19, "Auth", size=13, fill=DB["label"], weight="bold"))
auth_items = [
    ("이메일 / 비밀번호", "기본 Supabase Auth"),
    ("JWT 세션", "onAuthStateChange"),
    ("handle_new_user", "회원가입 profiles INSERT 트리거"),
    ("set search_path = public", "security definer 필수"),
    ("enumeration 방지", "resetPassword 성공 위장"),
    ("admin REST API", "유저 존재 확인 (서버)"),
    ("RLS 역할 제어", "driver · manager · admin"),
    ("GRANT 명시 필수", "SQL 직접 생성 테이블"),
]
for i, (k, v) in enumerate(auth_items):
    yy = AUY + 36 + i * 62
    lines.append(rect(AUX+10, yy, AUW-20, 55, rx=5, fill="#0a1f10", stroke="#065f46"))
    lines.append(txt(AUX+20, yy+16, k, size=10.5, fill="#34d399", anchor="start", weight="bold"))
    lines.append(txt(AUX+20, yy+34, v, size=9.5, fill="#6ee7b7", anchor="start"))

# ── PostgreSQL DB ──────────────────────────────────────────
DBX, DBY, DBW, DBH = 455, 1138, 640, 550
lines.append(rect(DBX, DBY, DBW, DBH, rx=8, fill="#071c0e", stroke="#059669"))
lines.append(txt(DBX+DBW//2, DBY+19, "PostgreSQL DB  (10 tables)", size=13, fill=DB["label"], weight="bold"))
tables = [
    ("profiles", "id · name · role · phone · equipment_codes · is_certified · rating"),
    ("jobs", "id · manager_id · title · work_date · location · status · pay_amount"),
    ("equipments", "id · job_id · model_code · is_filled"),
    ("applications", "id · job_id · driver_id · equipment_id · applied_equipment_code · status"),
    ("chat_rooms", "id · job_id · manager_id · driver_id · is_active"),
    ("messages", "id · room_id · sender_id · content · is_deleted · is_read"),
    ("notifications", "id · user_id · type · content · is_read · related_id"),
    ("reviews", "id · job_id · reviewer_id · reviewee_id · rating · comment"),
    ("ledger_expenses", "id · user_id · job_id · amount · category · description · date"),
    ("certifications", "id · driver_id · status · file_url · reviewed_at"),
]
for i, (tname, cols) in enumerate(tables):
    yy = DBY + 36 + i * 51
    lines.append(rect(DBX+10, yy, DBW-20, 45, rx=5, fill="#0a1f10", stroke="#065f46"))
    lines.append(txt(DBX+20, yy+15, tname, size=10.5, fill="#34d399", anchor="start", weight="bold", mono=True))
    cols_d = cols if len(cols) < 74 else cols[:71] + "..."
    lines.append(txt(DBX+20, yy+32, cols_d, size=8, fill="#6ee7b7", anchor="start", mono=True))

# ── Realtime ───────────────────────────────────────────────
RTX, RTY, RTW, RTH = 1115, 1138, 395, 550
lines.append(rect(RTX, RTY, RTW, RTH, rx=8, fill="#071c0e", stroke="#059669"))
lines.append(txt(RTX+RTW//2, RTY+19, "Realtime", size=13, fill=DB["label"], weight="bold"))
rt_items = [
    ("채팅 메시지", "messages INSERT 구독"),
    ("메시지 삭제", "is_deleted UPDATE 이벤트"),
    ("읽음 처리", "is_read UPDATE 이벤트"),
    ("알림 구독", "notifications INSERT"),
    ("REPLICA IDENTITY", "DEFAULT - ID 기반 확인"),
    ("payload.new", "변경 컬럼만 포함 (주의)"),
    ("안전한 UPDATE", "prev.some(m => m.id === id)"),
    ("채팅 filter", "room_id=eq.{id}"),
]
for i, (k, v) in enumerate(rt_items):
    yy = RTY + 36 + i * 62
    lines.append(rect(RTX+10, yy, RTW-20, 55, rx=5, fill="#0a1f10", stroke="#065f46"))
    lines.append(txt(RTX+20, yy+16, k, size=10.5, fill="#34d399", anchor="start", weight="bold"))
    lines.append(txt(RTX+20, yy+34, v, size=9.5, fill="#6ee7b7", anchor="start"))

# ── Storage ────────────────────────────────────────────────
STX, STY, STW, STH = 1530, 1138, 370, 550
lines.append(rect(STX, STY, STW, STH, rx=8, fill="#071c0e", stroke="#059669"))
lines.append(txt(STX+STW//2, STY+19, "Storage", size=13, fill=DB["label"], weight="bold"))
storage_items = [
    ("avatars/", "프로필 사진"),
    ("certifications/", "인증 서류 파일"),
    ("Signed URL", "/api/certifications/signed-url"),
    ("업로드 흐름", "PUT presigned -> DB URL"),
    ("접근 제어", "RLS + Storage 정책"),
    ("형식 제한", "JPG / PNG / PDF"),
    ("교체 시", "이전 파일 삭제 후 업로드"),
]
for i, (k, v) in enumerate(storage_items):
    yy = STY + 36 + i * 72
    lines.append(rect(STX+10, yy, STW-20, 64, rx=5, fill="#0a1f10", stroke="#065f46"))
    lines.append(txt(STX+20, yy+20, k, size=10.5, fill="#34d399", anchor="start", weight="bold", mono=True))
    lines.append(txt(STX+20, yy+40, v, size=9.5, fill="#6ee7b7", anchor="start"))

# ── Tools / Infra ──────────────────────────────────────────
EX, EY, EW, EH = 1920, 1138, 355, 550
EC = C["external"]
lines.append(rect(EX, EY, EW, EH, rx=8, fill=EC["bg"], stroke=EC["border"]))
lines.append(txt(EX+EW//2, EY+19, "Dev Tools / Infra", size=13, fill=EC["label"], weight="bold"))
infra = [
    ("Bun", "패키지 매니저 / 런타임"),
    ("TypeScript", "strict 모드 · unknown > any"),
    ("Tailwind CSS", "인라인 style 금지"),
    ("ESLint", "next/core-web-vitals"),
    ("브랜치 전략", "main(배포) · dev · feat/xxx"),
    ("커밋 컨벤션", "feat / fix / style / refactor"),
    ("Notion 연동", "개발 로그 · 작업 관리 자동 업데이트"),
]
for i, (k, v) in enumerate(infra):
    yy = EY + 36 + i * 72
    lines.append(rect(EX+10, yy, EW-20, 64, rx=5, fill="#0f0b1f", stroke="#6d28d9"))
    lines.append(txt(EX+20, yy+20, k, size=10.5, fill="#c084fc", anchor="start", weight="bold"))
    lines.append(txt(EX+20, yy+40, v, size=9.5, fill="#a78bfa", anchor="start"))

# ══════════════════════════════════════════════════════════
# 푸터
# ══════════════════════════════════════════════════════════
lines.append(f'<line x1="40" y1="{H-44}" x2="{W-40}" y2="{H-44}" stroke="#1e293b" stroke-width="1"/>')
footer = "Diggo  |  Next.js 16  ·  Supabase  ·  Vercel  ·  Bun  ·  TypeScript  ·  Tailwind CSS  ·  Zustand  ·  TanStack Query v5"
lines.append(txt(W//2, H-22, footer, size=10, fill="#334155"))

# ══════════════════════════════════════════════════════════
# SVG 조립
# ══════════════════════════════════════════════════════════
content = "\n  ".join(lines)
svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  {MARKER}
  {content}
</svg>'''

out_path = "/Users/saminjae/diggo/docs/architecture.svg"
os.makedirs("/Users/saminjae/diggo/docs", exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(svg)
print(f"SVG 완료: {out_path}  ({W}x{H}px)")
