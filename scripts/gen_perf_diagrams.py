#!/usr/bin/env python3
"""퍼포먼스 다이어그램 — 심플 화이트보드 스타일"""
import html, os, subprocess

def e(s): return html.escape(str(s), quote=False)

def svg_wrap(w, h, body):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <style>text{{font-family:-apple-system,"Segoe UI",sans-serif}}</style>
    <marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#333"/>
    </marker>
    <marker id="ad" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#999"/>
    </marker>
  </defs>
  {body}
</svg>'''

def bg(w, h):
    return f'<rect x="0" y="0" width="{w}" height="{h}" fill="#ffffff"/>'

def rbox(x, y, w, h, fill="#fff", stroke="#333", rx=8, sw=1.5):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def circle(cx, cy, r, fill="#fff", stroke="#333", sw=1.5):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def txt(x, y, s, size=13, fill="#222", anchor="middle", weight="normal"):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}">{e(s)}</text>'

def arr(x1, y1, x2, y2, dashed=False, color="#333"):
    dash = ' stroke-dasharray="5,4"' if dashed else ""
    mk = "ad" if dashed else "a"
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.4"{dash} marker-end="url(#{mk})"/>'

def save(name, w, h, body):
    svg = svg_wrap(w, h, body)
    sp = f"/Users/saminjae/diggo/docs/{name}.svg"
    pp = f"/Users/saminjae/diggo/docs/{name}.png"
    with open(sp, "w", encoding="utf-8") as f:
        f.write(svg)
    subprocess.run(["node", "-e", f"""
const sharp = require('sharp');
sharp('{sp}').png({{density:144}}).toFile('{pp}',(e,i)=>{{
  if(e)console.error(e);else console.log('OK {name}',i.width+'x'+i.height);
}});
"""], check=True)

# ══════════════════════════════════════════════════
# 1. LCP — 시퀀스
# ══════════════════════════════════════════════════
def make_lcp():
    W, H = 960, 480
    lines = [bg(W, H)]

    # ── BEFORE (왼쪽) ─────────────────────────────
    # 노드
    lines.append(circle(80, 160, 30, "#fff", "#333"))
    lines.append(txt(80, 165, "Client", 12))

    lines.append(rbox(180, 136, 120, 48, "#fff", "#333"))
    lines.append(txt(240, 165, "Server", 13))

    lines.append(rbox(360, 100, 130, 48, "#fff", "#333"))
    lines.append(txt(425, 129, "Supabase", 13))

    # 반복 조회 표시
    lines.append(rbox(360, 168, 130, 48, "#FFEBEE", "#E57373", sw=1.5))
    lines.append(txt(425, 186, "Supabase", 12))
    lines.append(txt(425, 202, "(재조회)", 11, fill="#C62828"))

    # 화살표
    lines.append(arr(110, 160, 178, 160))
    lines.append(txt(145, 153, "요청", 10, "#555"))

    lines.append(arr(300, 148, 358, 124))
    lines.append(txt(340, 128, "1", 10, "#555"))

    lines.append(arr(358, 192, 300, 175))
    lines.append(txt(340, 195, "2  rows", 10, "#999"))

    lines.append(arr(300, 175, 358, 192))
    lines.append(txt(360, 170, "3", 10, "#555"))

    lines.append(arr(358, 205, 300, 184))
    lines.append(txt(340, 215, "4  rows", 10, "#C62828"))

    lines.append(arr(180, 170, 112, 170))
    lines.append(txt(145, 180, "응답", 10, "#555"))

    lines.append(txt(260, 248, "매 요청마다 Supabase 재조회", 11, "#C62828"))
    lines.append(txt(260, 265, "→ LCP 9.0s", 12, "#C62828", weight="bold"))

    # BEFORE 레이블
    lines.append(txt(260, 88, "BEFORE", 13, "#C62828", weight="bold"))

    # ── AFTER (오른쪽) ────────────────────────────
    lines.append(circle(540, 160, 30, "#fff", "#333"))
    lines.append(txt(540, 165, "Client", 12))

    lines.append(rbox(640, 136, 120, 48, "#fff", "#333"))
    lines.append(txt(700, 165, "Server", 13))

    lines.append(rbox(820, 100, 120, 48, "#E8F5E9", "#43A047", sw=1.5))
    lines.append(txt(880, 122, "Cache", 13, "#2E7D32", weight="bold"))
    lines.append(txt(880, 139, "'use cache'", 10, "#2E7D32"))

    lines.append(rbox(820, 168, 120, 48, "#fff", "#bbb"))
    lines.append(txt(880, 192, "Supabase", 12, "#999"))
    lines.append(txt(880, 207, "(최초 1회)", 10, "#bbb"))

    # 화살표
    lines.append(arr(570, 160, 638, 160))
    lines.append(txt(605, 153, "요청", 10, "#555"))

    lines.append(arr(760, 148, 818, 120))
    lines.append(txt(800, 126, "1", 10, "#555"))

    lines.append(arr(818, 136, 760, 156))
    lines.append(txt(800, 148, "2  HIT", 10, "#2E7D32"))

    lines.append(arr(640, 170, 572, 170))
    lines.append(txt(605, 182, "즉시 반환", 10, "#2E7D32"))

    # Supabase 점선 (최초만)
    lines.append(arr(760, 162, 818, 178, dashed=True))
    lines.append(arr(818, 192, 760, 175, dashed=True))

    lines.append(txt(720, 248, "캐시 HIT → Supabase 호출 0회", 11, "#2E7D32"))
    lines.append(txt(720, 265, "→ LCP 4.4s  (-51%)", 12, "#2E7D32", weight="bold"))

    lines.append(txt(720, 88, "AFTER", 13, "#2E7D32", weight="bold"))

    # 구분선
    lines.append(f'<line x1="480" y1="80" x2="480" y2="290" stroke="#ddd" stroke-width="1.5" stroke-dasharray="4,4"/>')

    # 하단 코드
    lines.append(f'<rect x="40" y="300" width="{W-80}" height="36" rx="6" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>')
    lines.append(txt(W//2, 323, "'use cache'   cacheLife('seconds')   cacheTag('jobs')   revalidateTag('jobs', 'max')", 11, "#555"))

    # 제목
    lines.append(txt(W//2, 40, "LCP 최적화  —  Largest Contentful Paint  9.0s → 4.4s", 16, "#111", weight="bold"))

    save("perf1_lcp", W, H, "\n".join(lines))

# ══════════════════════════════════════════════════
# 2. TBT — 시퀀스 스타일 (클라이언트 측 블로킹)
# ══════════════════════════════════════════════════
def make_tbt():
    W, H = 960, 500
    lines = [bg(W, H)]

    lines.append(txt(W//2, 38, "TBT 최적화  —  Total Blocking Time  70ms → 0ms", 16, "#111", weight="bold"))
    lines.append(f'<line x1="480" y1="55" x2="480" y2="430" stroke="#ddd" stroke-width="1.5" stroke-dasharray="4,4"/>')

    # ── BEFORE ──────────────────────────────────────
    lines.append(txt(220, 68, "BEFORE  ·  70ms", 13, "#C62828", weight="bold"))

    # Server
    lines.append(rbox(60, 140, 110, 46, "#fff", "#333"))
    lines.append(txt(115, 168, "Server", 13))

    # Browser 외곽 (큰 박스 — 브라우저 전체)
    lines.append(rbox(230, 110, 210, 180, "#FFF8F8", "#E57373", rx=10, sw=1.5))
    lines.append(txt(335, 128, "Browser", 11, "#C62828", weight="bold"))

    # 브라우저 안: JS Engine
    lines.append(rbox(248, 136, 172, 44, "#FFEBEE", "#E57373", rx=6))
    lines.append(txt(334, 155, "JS Engine", 12, "#C62828", weight="bold"))
    lines.append(txt(334, 170, "JS bundle 파싱·실행", 10, "#C62828"))

    # 브라우저 안: Main Thread
    lines.append(rbox(248, 192, 172, 44, "#FFEBEE", "#C62828", rx=6, sw=2))
    lines.append(txt(334, 211, "Main Thread", 12, "#C62828", weight="bold"))
    lines.append(txt(334, 226, "BLOCKED  70ms", 11, "#C62828"))

    # 화살표
    lines.append(arr(170, 160, 228, 155))
    lines.append(txt(200, 149, "GET /jobs", 10, "#555"))

    lines.append(arr(228, 170, 170, 168))
    lines.append(txt(197, 163, "1  large JS bundle", 10, "#C62828"))

    # JS Engine → Main Thread (브라우저 내부)
    lines.append(arr(334, 180, 334, 190, color="#C62828"))
    lines.append(txt(355, 187, "2  파싱", 10, "#C62828", anchor="start"))

    lines.append(txt(335, 315, "매 요청마다 재렌더 → 무거운 JS 전송", 11, "#C62828"))
    lines.append(txt(335, 332, "→ 브라우저 메인 스레드 블로킹  70ms", 12, "#C62828", weight="bold"))

    lines.append(rbox(50, 356, 390, 30, "#f5f5f5", "#e0e0e0", rx=6))
    lines.append(txt(245, 375, "cacheComponents: false  —  매 요청 서버 재렌더", 10, "#888"))

    # ── AFTER ───────────────────────────────────────
    lines.append(txt(710, 68, "AFTER  ·  0ms", 13, "#2E7D32", weight="bold"))

    # Server
    lines.append(rbox(510, 140, 110, 46, "#fff", "#333"))
    lines.append(txt(565, 168, "Server", 13))

    # Cache
    lines.append(rbox(510, 210, 110, 46, "#E8F5E9", "#43A047"))
    lines.append(txt(565, 234, "Cache", 13, "#2E7D32", weight="bold"))
    lines.append(arr(565, 186, 565, 208, color="#43A047"))
    lines.append(txt(580, 200, "HIT", 10, "#2E7D32", anchor="start"))

    # Browser 외곽
    lines.append(rbox(680, 110, 230, 180, "#F1F8E9", "#81C784", rx=10, sw=1.5))
    lines.append(txt(795, 128, "Browser", 11, "#2E7D32", weight="bold"))

    # 브라우저 안: Min JS
    lines.append(rbox(698, 136, 192, 44, "#E8F5E9", "#43A047", rx=6))
    lines.append(txt(794, 155, "Min JS  (하이드레이션만)", 11, "#2E7D32", weight="bold"))
    lines.append(txt(794, 170, "캐시된 RSC payload 재사용", 10, "#2E7D32"))

    # 브라우저 안: Main Thread
    lines.append(rbox(698, 192, 192, 44, "#E8F5E9", "#2E7D32", rx=6, sw=2))
    lines.append(txt(794, 211, "Main Thread", 12, "#2E7D32", weight="bold"))
    lines.append(txt(794, 226, "FREE  —  0ms", 11, "#2E7D32"))

    lines.append(arr(622, 155, 678, 152))
    lines.append(txt(650, 144, "1  캐시된 결과", 10, "#2E7D32"))

    lines.append(arr(794, 180, 794, 190, color="#2E7D32"))
    lines.append(txt(815, 187, "2  경량", 10, "#2E7D32", anchor="start"))

    lines.append(txt(755, 315, "캐시 HIT → 최소 JS만 브라우저로 전송", 11, "#2E7D32"))
    lines.append(txt(755, 332, "→ 메인 스레드 블로킹 없음  0ms", 12, "#2E7D32", weight="bold"))

    lines.append(rbox(500, 356, 420, 30, "#f5f5f5", "#e0e0e0", rx=6))
    lines.append(txt(710, 375, "cacheComponents: true  —  렌더 결과 캐싱 → JS 전송량 감소", 10, "#555"))

    lines.append(f'<line x1="40" y1="400" x2="{W-40}" y2="400" stroke="#eee" stroke-width="1"/>')
    lines.append(txt(W//2, 420, "TBT는 브라우저 메인 스레드 블로킹 시간 — 서버 캐싱으로 전송 JS를 줄이면 클라이언트 블로킹이 감소한다", 11, "#999"))

    save("perf2_tbt", W, H, "\n".join(lines))

# ══════════════════════════════════════════════════
# 3. Score — 두 문제 → 점수 연결 구조
# ══════════════════════════════════════════════════
def make_score():
    W, H = 960, 520
    lines = [bg(W, H)]

    lines.append(txt(W//2, 36, "Performance Score  73점 → 83점  (+10점)", 16, "#111", weight="bold"))
    lines.append(f'<line x1="40" y1="50" x2="{W-40}" y2="50" stroke="#eee" stroke-width="1"/>')

    # ── BEFORE 컬럼 ─────────────────────────────────
    lines.append(txt(230, 72, "BEFORE  ·  캐싱 없음", 13, "#C62828", weight="bold"))

    # 문제 1: LCP
    lines.append(rbox(50, 88, 360, 80, "#FFF8F8", "#E57373", rx=8))
    lines.append(txt(70, 108, "문제 1  —  LCP 9.0s", 12, "#C62828", weight="bold", anchor="start"))
    lines.append(txt(70, 128, "매 요청마다 Supabase 재조회", 11, "#555", anchor="start"))
    lines.append(txt(70, 146, "→ 서버 응답 지연 → 첫 화면 느림", 11, "#555", anchor="start"))

    # 문제 2: TBT
    lines.append(rbox(50, 188, 360, 80, "#FFF8F8", "#E57373", rx=8))
    lines.append(txt(70, 208, "문제 2  —  TBT 70ms", 12, "#C62828", weight="bold", anchor="start"))
    lines.append(txt(70, 228, "캐싱 없이 매번 서버 재렌더", 11, "#555", anchor="start"))
    lines.append(txt(70, 246, "→ 무거운 JS 번들 → 브라우저 블로킹", 11, "#555", anchor="start"))

    # BEFORE 결과
    lines.append(arr(230, 268, 230, 298, color="#C62828"))
    lines.append(rbox(100, 298, 260, 56, "#FFEBEE", "#C62828", rx=8, sw=2))
    lines.append(txt(230, 323, "Performance Score", 12, "#C62828"))
    lines.append(txt(230, 343, "73점", 18, "#C62828", weight="bold"))

    # ── AFTER 컬럼 ──────────────────────────────────
    lines.append(txt(720, 72, "AFTER  ·  캐싱 적용", 13, "#2E7D32", weight="bold"))

    # 해결 1: use cache
    lines.append(rbox(550, 88, 360, 80, "#F1F8E9", "#81C784", rx=8))
    lines.append(txt(570, 108, "해결 1  —  LCP 4.4s  (-51%)", 12, "#2E7D32", weight="bold", anchor="start"))
    lines.append(txt(570, 128, "'use cache'  +  cacheLife  +  cacheTag", 11, "#555", anchor="start"))
    lines.append(txt(570, 146, "→ Supabase 재조회 0회 → 즉시 응답", 11, "#555", anchor="start"))

    # 해결 2: cacheComponents
    lines.append(rbox(550, 188, 360, 80, "#F1F8E9", "#81C784", rx=8))
    lines.append(txt(570, 208, "해결 2  —  TBT 0ms", 12, "#2E7D32", weight="bold", anchor="start"))
    lines.append(txt(570, 228, "cacheComponents: true  +  SSR 정렬 통일", 11, "#555", anchor="start"))
    lines.append(txt(570, 246, "→ 렌더 캐싱 → 경량 JS → 블로킹 제거", 11, "#555", anchor="start"))

    # AFTER 결과
    lines.append(arr(730, 268, 730, 298, color="#2E7D32"))
    lines.append(rbox(600, 298, 260, 56, "#E8F5E9", "#2E7D32", rx=8, sw=2))
    lines.append(txt(730, 323, "Performance Score", 12, "#2E7D32"))
    lines.append(txt(730, 343, "83점  (+10점)", 18, "#2E7D32", weight="bold"))

    # 가운데 화살표
    lines.append(f'<line x1="420" y1="200" x2="540" y2="200" stroke="#bbb" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#a)"/>')
    lines.append(txt(480, 192, "캐싱 적용", 11, "#888"))

    # 구분 수직선
    lines.append(f'<line x1="480" y1="58" x2="480" y2="380" stroke="#ddd" stroke-width="1.5" stroke-dasharray="4,4"/>')

    # 하단 코드
    lines.append(f'<line x1="40" y1="376" x2="{W-40}" y2="376" stroke="#eee" stroke-width="1"/>')
    lines.append(rbox(40, 390, W-80, 30, "#f5f5f5", "#e0e0e0", rx=6))
    lines.append(txt(W//2, 410, "'use cache'   cacheLife('seconds')   cacheTag('jobs')   cacheComponents: true   revalidateTag('jobs','max')", 11, "#555"))
    lines.append(txt(W//2, 450, "TTFB 10ms 이하  ·  DB 부하 없음  ·  데이터 정합성은 revalidateTag로 보장", 11, "#999"))

    save("perf3_score", W, H, "\n".join(lines))

os.makedirs("/Users/saminjae/diggo/docs", exist_ok=True)
make_lcp();   print("1/3 ✓ perf1_lcp")
make_tbt();   print("2/3 ✓ perf2_tbt")
make_score(); print("3/3 ✓ perf3_score")
