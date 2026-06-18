#!/usr/bin/env python3
"""포트폴리오용 문제 해결 다이어그램 3개 생성"""
import html, os

def e(s): return html.escape(str(s), quote=False)

# ── 색상 팔레트 ───────────────────────────────────────────
RED       = "#EF4444"; RED_L   = "#FEF2F2"; RED_D   = "#B91C1C"
GREEN     = "#10B981"; GREEN_L = "#F0FDF4"; GREEN_D = "#047857"
BLUE      = "#3B82F6"; BLUE_L  = "#EFF6FF"; BLUE_D  = "#1D4ED8"
PURPLE    = "#8B5CF6"; PURPLE_L= "#F5F3FF"
GRAY      = "#94A3B8"; GRAY_D  = "#475569"
SLATE     = "#64748B"; DARK    = "#0F172A"
BG        = "#FAFAFA"; WHITE   = "#FFFFFF"
DIVIDER   = "#E2E8F0"

def svg_wrap(w, h, body):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs><style>text{{font-family:-apple-system,"Segoe UI",sans-serif}}</style></defs>
  {body}
</svg>'''

def box(x, y, w, h, fill=WHITE, stroke=DIVIDER, rx=8, sw=1.5):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def txt(x, y, s, size=12, fill=DARK, anchor="middle", weight="normal", mono=False):
    fam = "monospace" if mono else "inherit"
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" font-family="{fam}">{e(s)}</text>'

def arrow_right(x1, x2, y, color=GRAY, label="", dashed=False):
    dash = ' stroke-dasharray="5,4"' if dashed else ""
    out = [f'<line x1="{x1}" y1="{y}" x2="{x2-9}" y2="{y}" stroke="{color}" stroke-width="1.8"{dash}/>',
           f'<polygon points="{x2-9},{y-5} {x2-9},{y+5} {x2},{y}" fill="{color}"/>']
    if label:
        out.append(txt((x1+x2)//2, y-8, label, size=10, fill=color))
    return "\n".join(out)

def arrow_left(x1, x2, y, color=GRAY, label="", dashed=False):
    dash = ' stroke-dasharray="5,4"' if dashed else ""
    out = [f'<line x1="{x1+9}" y1="{y}" x2="{x2}" y2="{y}" stroke="{color}" stroke-width="1.8"{dash}/>',
           f'<polygon points="{x1+9},{y-5} {x1+9},{y+5} {x1},{y}" fill="{color}"/>']
    if label:
        out.append(txt((x1+x2)//2, y-8, label, size=10, fill=color))
    return "\n".join(out)

def arrow_down(x, y1, y2, color=GRAY, label="", dashed=False):
    dash = ' stroke-dasharray="5,4"' if dashed else ""
    out = [f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2-9}" stroke="{color}" stroke-width="1.8"{dash}/>',
           f'<polygon points="{x-5},{y2-9} {x+5},{y2-9} {x},{y2}" fill="{color}"/>']
    if label:
        out.append(txt(x+14, (y1+y2)//2+4, label, size=10, fill=color, anchor="start"))
    return "\n".join(out)

def label_box(x, y, w, h, title, fill, stroke, title_color=WHITE):
    """헤더 색 띠 + 흰 본문 박스"""
    hh = 30
    out = [box(x, y, w, h, fill=WHITE, stroke=stroke, rx=8)]
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" rx="8" fill="{fill}" stroke="{fill}" stroke-width="1"/>')
    out.append(f'<rect x="{x}" y="{y+20}" width="{w}" height="{hh-20}" rx="0" fill="{fill}" stroke="none"/>')
    out.append(txt(x+w//2, y+20, title, size=11, fill=title_color, weight="bold"))
    return "\n".join(out)

def tag(x, y, label, color, bg):
    w = len(label)*6.5 + 16
    return (f'<rect x="{x}" y="{y-13}" width="{w}" height="18" rx="4" fill="{bg}" stroke="{color}"/>'
            f'<text x="{x+w/2}" y="{y}" font-size="10" fill="{color}" text-anchor="middle" font-weight="bold"'
            f' font-family="inherit">{e(label)}</text>')


# ══════════════════════════════════════════════════════════
# DIAGRAM 1 — Realtime UPDATE 미반영 (시퀀스)
# ══════════════════════════════════════════════════════════
def make_diagram1():
    W, H = 1080, 600
    els = []
    els.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
    els.append(box(0, 0, W, H, fill=BG, stroke=DIVIDER, rx=0, sw=1))

    # 제목
    els.append(txt(W//2, 34, "Supabase Realtime UPDATE 미반영", size=17, fill=DARK, weight="700"))
    els.append(txt(W//2, 56, "REPLICA IDENTITY DEFAULT — payload.new에 변경된 컬럼만 포함됨", size=11, fill=SLATE))
    els.append(f'<line x1="40" y1="68" x2="{W-40}" y2="68" stroke="{DIVIDER}" stroke-width="1"/>')

    # ── 3개 Actor ────────────────────────────────────────
    actors = [
        (120,  "Client A",      "메시지 삭제자",  BLUE,   BLUE_L),
        (540,  "Supabase",      "DB + Realtime",  PURPLE, PURPLE_L),
        (920,  "Client B",      "수신 화면",      BLUE,   BLUE_L),
    ]
    TOP_Y = 82
    LIFE_BOTTOM = 560

    for cx, name, sub, color, light in actors:
        bw = 150
        els.append(box(cx-bw//2, TOP_Y, bw, 50, fill=light, stroke=color, rx=8))
        els.append(txt(cx, TOP_Y+20, name, size=12, fill=color, weight="bold"))
        els.append(txt(cx, TOP_Y+36, sub, size=10, fill=SLATE))
        # lifeline
        els.append(f'<line x1="{cx}" y1="{TOP_Y+50}" x2="{cx}" y2="{LIFE_BOTTOM}" stroke="{color}" stroke-width="1.2" stroke-dasharray="6,4" opacity="0.4"/>')

    # ── 시퀀스 스텝 ──────────────────────────────────────
    # [문제 구간] 배경
    els.append(f'<rect x="40" y="152" width="{W-80}" height="220" rx="8" fill="{RED_L}" opacity="0.5"/>')
    els.append(tag(46, 165, "❌  문제", RED, RED_L))

    # Step 1: A → Supabase (is_deleted UPDATE)
    els.append(arrow_right(120, 540, 178, BLUE, "is_deleted = true  (UPDATE)"))
    els.append(txt(40, 178, "1", size=10, fill=GRAY, anchor="start"))

    # Step 2: Supabase → B (payload.new)
    els.append(arrow_right(540, 920, 218, PURPLE, "payload.new  =  { id, is_deleted }"))
    els.append(txt(40, 218, "2", size=10, fill=GRAY, anchor="start"))
    # payload 상세
    els.append(box(620, 224, 240, 36, fill="#F3E8FF", stroke=PURPLE, rx=6))
    els.append(txt(740, 238, "room_id →", size=10, fill=PURPLE, weight="bold"))
    els.append(txt(740, 252, "undefined  (변경 안 됨 → 포함 안 됨)", size=9, fill=GRAY))

    # Step 3: Client B 체크
    els.append(box(820, 272, 190, 40, fill=WHITE, stroke=RED, rx=6))
    els.append(txt(915, 289, "if (room_id !== currentRoom.id)", size=9, fill=RED, mono=True))
    els.append(txt(915, 305, "→  undefined !== 'abc'  →  true", size=9, fill=RED, mono=True))

    els.append(arrow_right(540, 820, 292, RED, "early return  ❌", dashed=True))
    els.append(txt(40, 292, "3", size=10, fill=GRAY, anchor="start"))

    # Step 4: 결과 없음
    els.append(box(820, 328, 190, 32, fill=RED_L, stroke=RED, rx=6))
    els.append(txt(915, 349, "화면 미반영  (버그)", size=11, fill=RED_D, weight="bold"))
    els.append(txt(40, 344, "4", size=10, fill=GRAY, anchor="start"))

    # [해결 구간] 배경
    els.append(f'<rect x="40" y="388" width="{W-80}" height="156" rx="8" fill="{GREEN_L}" opacity="0.6"/>')
    els.append(tag(46, 401, "✓  해결", GREEN, GREEN_L))

    # 구분선
    els.append(f'<line x1="80" y1="385" x2="{W-80}" y2="385" stroke="{GREEN}" stroke-width="1.2" stroke-dasharray="4,3"/>')
    els.append(txt(W//2, 381, "수정 후", size=10, fill=GREEN_D, weight="bold"))

    # Step 5: Supabase → B (동일 payload)
    els.append(arrow_right(540, 920, 418, PURPLE, "payload.new  =  { id, is_deleted }"))
    els.append(txt(40, 418, "5", size=10, fill=GRAY, anchor="start"))

    # Step 6: ID 존재 여부 체크
    els.append(box(820, 432, 190, 40, fill=WHITE, stroke=GREEN, rx=6))
    els.append(txt(915, 449, "prev.some(m => m.id === id)", size=9, fill=GREEN_D, mono=True))
    els.append(txt(915, 465, "→  true  →  업데이트 진행", size=9, fill=GREEN_D, mono=True))

    els.append(arrow_right(540, 820, 452, GREEN, "ID 기반 귀속 판단  ✓"))
    els.append(txt(40, 452, "6", size=10, fill=GRAY, anchor="start"))

    # Step 7: 결과
    els.append(box(820, 488, 190, 32, fill=GREEN_L, stroke=GREEN, rx=6))
    els.append(txt(915, 509, "실시간 UI 동기화  ✓", size=11, fill=GREEN_D, weight="bold"))
    els.append(txt(40, 504, "7", size=10, fill=GRAY, anchor="start"))

    return svg_wrap(W, H, "\n".join(els))


# ══════════════════════════════════════════════════════════
# DIAGRAM 2 — SSR ↔ TanStack Query 정렬 불일치 (워크플로우)
# ══════════════════════════════════════════════════════════
def make_diagram2():
    W, H = 1080, 520
    els = []
    els.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
    els.append(box(0, 0, W, H, fill=BG, stroke=DIVIDER, rx=0, sw=1))

    els.append(txt(W//2, 34, "SSR ↔ TanStack Query 정렬 불일치", size=17, fill=DARK, weight="700"))
    els.append(txt(W//2, 56, "staleTime 만료 후 re-fetch 시 서버/클라이언트 정렬 기준 충돌", size=11, fill=SLATE))
    els.append(f'<line x1="40" y1="68" x2="{W-40}" y2="68" stroke="{DIVIDER}" stroke-width="1"/>')

    # ── Before (문제) ────────────────────────────────────
    BX = 40
    els.append(f'<rect x="{BX}" y="80" width="490" height="390" rx="10" fill="{RED_L}" opacity="0.4"/>')
    els.append(tag(BX+8, 93, "❌  문제 흐름", RED, RED_L))

    def flow_box(x, y, w, title, sub, color, light):
        h = 54
        els.append(box(x, y, w, h, fill=light, stroke=color, rx=8))
        els.append(txt(x+w//2, y+21, title, size=11, fill=color, weight="bold"))
        els.append(txt(x+w//2, y+38, sub, size=9.5, fill=SLATE))
        return y + h

    # Before 흐름
    bw = 360; bx0 = BX + 65; by = 104
    by = flow_box(bx0, by, bw, "Vercel (SSR 렌더링)", "정렬 기준: created_at DESC  (최신 등록순)", BLUE, BLUE_L); by += 14
    els.append(arrow_down(bx0+bw//2, by, by+24, BLUE, "프리페치 결과 hydration")); by += 24
    by = flow_box(bx0, by, bw, "Browser 초기 화면", "목록 순서: 2026-06-18 등록순으로 표시", BLUE, BLUE_L); by += 14
    els.append(arrow_down(bx0+bw//2, by, by+24, GRAY, "⏱  staleTime 30s 경과")); by += 24
    by = flow_box(bx0, by, bw, "포커스 이벤트 → re-fetch", "TanStack Query 기본값: sortBy = 'deadline'", PURPLE, PURPLE_L); by += 14
    els.append(arrow_down(bx0+bw//2, by, by+24, PURPLE, "클라이언트 재요청")); by += 24
    # 결과 박스
    els.append(box(bx0, by, bw, 48, fill=RED_L, stroke=RED, rx=8))
    els.append(txt(bx0+bw//2, by+20, "목록 순서 교체  ❌", size=12, fill=RED_D, weight="bold"))
    els.append(txt(bx0+bw//2, by+37, "work_date ASC (마감임박순)으로 갑자기 변경", size=9.5, fill=RED_D))

    # ── After (해결) ─────────────────────────────────────
    AX = 550
    els.append(f'<rect x="{AX}" y="80" width="490" height="390" rx="10" fill="{GREEN_L}" opacity="0.4"/>')
    els.append(tag(AX+8, 93, "✓  해결 후", GREEN, GREEN_L))

    aw = 360; ax0 = AX + 65; ay = 104
    ay = flow_box(ax0, ay, aw, "Vercel (SSR 렌더링)", "정렬 기준: work_date ASC  (마감임박순) ← 통일", GREEN, GREEN_L); ay += 14
    els.append(arrow_down(ax0+aw//2, ay, ay+24, GREEN, "동일 기준으로 hydration")); ay += 24
    ay = flow_box(ax0, ay, aw, "Browser 초기 화면", "목록 순서: 마감임박순으로 표시", GREEN, GREEN_L); ay += 14
    els.append(arrow_down(ax0+aw//2, ay, ay+24, GRAY, "⏱  staleTime 30s 경과")); ay += 24
    ay = flow_box(ax0, ay, aw, "포커스 이벤트 → re-fetch", "sortBy = 'deadline'  (동일 기준)", PURPLE, PURPLE_L); ay += 14
    els.append(arrow_down(ax0+aw//2, ay, ay+24, PURPLE, "동일 파라미터로 재요청")); ay += 24
    els.append(box(ax0, ay, aw, 48, fill=GREEN_L, stroke=GREEN, rx=8))
    els.append(txt(ax0+aw//2, ay+20, "순서 유지  ✓", size=12, fill=GREEN_D, weight="bold"))
    els.append(txt(ax0+aw//2, ay+37, "SSR · 클라이언트 정렬 기준 통일 → 일관성 확보", size=9.5, fill=GREEN_D))

    # 중간 구분선
    els.append(f'<line x1="{W//2}" y1="85" x2="{W//2}" y2="465" stroke="{DIVIDER}" stroke-width="1.5" stroke-dasharray="6,4"/>')

    # 핵심 인사이트 박스 (하단)
    els.append(box(40, 476, W-80, 34, fill=WHITE, stroke=BLUE_D, rx=6, sw=1))
    els.append(txt(W//2, 498, "핵심: SSR prefetchInfiniteQuery의 정렬 기준과 TanStack Query queryKey의 기본 필터가 100% 일치해야 hydration 이후 re-fetch 시 데이터가 교체되지 않음", size=10, fill=BLUE_D))

    return svg_wrap(W, H, "\n".join(els))


# ══════════════════════════════════════════════════════════
# DIAGRAM 3 — 비밀번호 찾기 false success (Before/After)
# ══════════════════════════════════════════════════════════
def make_diagram3():
    W, H = 1080, 600
    els = []
    els.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
    els.append(box(0, 0, W, H, fill=BG, stroke=DIVIDER, rx=0, sw=1))

    els.append(txt(W//2, 34, "비밀번호 찾기  —  False Success", size=17, fill=DARK, weight="700"))
    els.append(txt(W//2, 56, "Supabase enumeration 방지 정책으로 SDK가 미가입 이메일에도 항상 error: null 반환", size=11, fill=SLATE))
    els.append(f'<line x1="40" y1="68" x2="{W-40}" y2="68" stroke="{DIVIDER}" stroke-width="1"/>')

    def step(x, y, w, h, title, sub, fill, stroke):
        els.append(box(x, y, w, h, fill=fill, stroke=stroke, rx=8))
        els.append(txt(x+w//2, y+h//2-6, title, size=11, fill=stroke, weight="bold"))
        if sub:
            els.append(txt(x+w//2, y+h//2+10, sub, size=9.5, fill=SLATE))

    gap = 16
    bw = 370; aw = 370

    # ── Before ───────────────────────────────────────────
    bx = 55; by = 82
    els.append(f'<rect x="30" y="{by}" width="490" height="470" rx="10" fill="{RED_L}" opacity="0.4"/>')
    els.append(tag(38, by+13, "❌  문제 흐름", RED, RED_L))
    by += 20

    step(bx, by, bw, 44, "사용자", "미가입 이메일 입력 후 전송", BLUE_L, BLUE); by += 44+gap
    els.append(arrow_down(bx+bw//2, by, by+gap, BLUE)); by += gap

    step(bx, by, bw, 50, "Client", "supabase.auth.resetPasswordForEmail(email)", "#F0F4FF", BLUE); by += 50+gap
    els.append(arrow_down(bx+bw//2, by, by+gap, RED)); by += gap

    step(bx, by, bw, 58, "Supabase Auth", "Enumeration 방지 옵션 ON", RED_L, RED)
    els.append(txt(bx+bw//2, by+42, "이메일 존재 여부 무관, 항상 { error: null } 반환", size=9.5, fill=RED_D))
    by += 58+gap
    els.append(arrow_down(bx+bw//2, by, by+gap, RED)); by += gap

    step(bx, by, bw, 44, "Client", "error: null  →  성공으로 판단", RED_L, RED); by += 44+gap
    els.append(arrow_down(bx+bw//2, by, by+gap, RED)); by += gap

    els.append(box(bx, by, bw, 46, fill=RED_L, stroke=RED, rx=8))
    els.append(txt(bx+bw//2, by+18, '"메일을 확인해 주세요"  표시  ❌', size=12, fill=RED_D, weight="bold"))
    els.append(txt(bx+bw//2, by+35, "미가입 이메일도 성공 화면 → 사용자 혼란", size=9.5, fill=RED_D))

    # ── After ────────────────────────────────────────────
    ax = 595; ay = 82
    els.append(f'<rect x="570" y="{ay}" width="490" height="470" rx="10" fill="{GREEN_L}" opacity="0.4"/>')
    els.append(tag(578, ay+13, "✓  해결 후", GREEN, GREEN_L))
    ay += 20

    step(ax, ay, aw, 44, "사용자", "미가입 이메일 입력 후 전송", BLUE_L, BLUE); ay += 44+gap
    els.append(arrow_down(ax+aw//2, ay, ay+gap, BLUE)); ay += gap

    step(ax, ay, aw, 50, "Client", "POST  /api/auth/reset-password  (API Route 경유)", "#F0F4FF", BLUE); ay += 50+gap
    els.append(arrow_down(ax+aw//2, ay, ay+gap, GREEN)); ay += gap

    step(ax, ay, aw, 58, "API Route  (서버)", "admin REST API로 이메일 존재 확인", GREEN_L, GREEN)
    els.append(txt(ax+aw//2, ay+42, "GET /auth/v1/admin/users?filter=email", size=9.5, fill=GREEN_D))
    ay += 58+gap
    els.append(arrow_down(ax+aw//2, ay, ay+gap, GREEN)); ay += gap

    # 분기 박스
    els.append(box(ax, ay, aw, 44, fill=WHITE, stroke=PURPLE, rx=8))
    els.append(txt(ax+aw//2, ay+17, "유저 존재 여부 판별", size=11, fill=PURPLE, weight="bold"))
    els.append(txt(ax+aw//2, ay+34, "users.some(u => u.email === email)", size=9.5, fill=PURPLE))
    br_y = ay + 44

    # 분기 선
    els.append(f'<line x1="{ax+aw//2}" y1="{br_y}" x2="{ax+70}" y2="{br_y+26}" stroke="{RED}" stroke-width="1.5"/>')
    els.append(f'<line x1="{ax+aw//2}" y1="{br_y}" x2="{ax+aw-70}" y2="{br_y+26}" stroke="{GREEN}" stroke-width="1.5"/>')

    els.append(box(ax+10, br_y+26, 155, 44, fill=RED_L, stroke=RED, rx=6))
    els.append(txt(ax+87, br_y+44, "없음  →  404 반환", size=10, fill=RED_D, weight="bold"))
    els.append(txt(ax+87, br_y+59, '"가입되지 않은 이메일"', size=9.5, fill=RED_D))

    els.append(box(ax+aw-165, br_y+26, 155, 44, fill=GREEN_L, stroke=GREEN, rx=6))
    els.append(txt(ax+aw-87, br_y+44, "있음  →  이메일 전송", size=10, fill=GREEN_D, weight="bold"))
    els.append(txt(ax+aw-87, br_y+59, "정상 발송  ✓", size=9.5, fill=GREEN_D))

    res_y = br_y + 26 + 44 + gap
    els.append(box(ax, res_y, aw, 46, fill=GREEN_L, stroke=GREEN, rx=8))
    els.append(txt(ax+aw//2, res_y+18, "정확한 피드백 제공  ✓", size=12, fill=GREEN_D, weight="bold"))
    els.append(txt(ax+aw//2, res_y+35, "미가입 → 에러 표시  /  가입됨 → 메일 발송", size=9.5, fill=GREEN_D))

    # 중간 구분선
    els.append(f'<line x1="{W//2}" y1="83" x2="{W//2}" y2="546" stroke="{DIVIDER}" stroke-width="1.5" stroke-dasharray="6,4"/>')

    # 핵심 인사이트
    els.append(box(30, 552, W-60, 36, fill=WHITE, stroke=BLUE_D, rx=6, sw=1))
    els.append(txt(W//2, 575, "핵심: 보안 기능(enumeration 방지)이 UX를 깨는 상황 → SDK를 우회해 서버에서 직접 검증하는 구조로 책임 분리", size=10, fill=BLUE_D))

    return svg_wrap(W, H, "\n".join(els))


# ── 저장 ─────────────────────────────────────────────────
os.makedirs("/Users/saminjae/diggo/docs", exist_ok=True)
diagrams = [
    ("problem1_realtime.svg",  make_diagram1()),
    ("problem2_sorting.svg",   make_diagram2()),
    ("problem3_password.svg",  make_diagram3()),
]
for fname, content in diagrams:
    path = f"/Users/saminjae/diggo/docs/{fname}"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"저장: {path}")
