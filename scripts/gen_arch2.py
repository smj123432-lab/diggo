#!/usr/bin/env python3
"""Diggo 포트폴리오용 아키텍처 다이어그램 (클린 버전)"""
import html, os

def e(s): return html.escape(str(s), quote=False)

W, H = 1500, 860

def r(x, y, w, h, rx=12, fill="#fff", stroke="#E2E8F0", sw=1.5, opacity=1):
    op = f' opacity="{opacity}"' if opacity < 1 else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{op}/>'

def t(x, y, s, size=13, fill="#1E293B", anchor="middle", weight="normal", mono=False):
    fam = "monospace" if mono else "inherit"
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" font-family="{fam}">{e(s)}</text>'

def arrow_v(x, y1, y2, color="#94A3B8", label="", dashed=False):
    dash = ' stroke-dasharray="6,4"' if dashed else ""
    out = [f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2-8}" stroke="{color}" stroke-width="1.8"{dash}/>',
           f'<polygon points="{x-5},{y2-8} {x+5},{y2-8} {x},{y2}" fill="{color}"/>']
    if label:
        out.append(t(x+14, (y1+y2)//2+4, label, size=10, fill="#94A3B8", anchor="start"))
    return "\n".join(out)

def arrow_h(x1, x2, y, color="#94A3B8", label="", dashed=False):
    dash = ' stroke-dasharray="6,4"' if dashed else ""
    out = [f'<line x1="{x1}" y1="{y}" x2="{x2-8}" y2="{y}" stroke="{color}" stroke-width="1.8"{dash}/>',
           f'<polygon points="{x2-8},{y-5} {x2-8},{y+5} {x2},{y}" fill="{color}"/>']
    if label:
        out.append(t((x1+x2)//2, y-7, label, size=10, fill="#94A3B8"))
    return "\n".join(out)

def card(x, y, w, h, title, items, accent, light, icon=""):
    out = []
    out.append(r(x, y, w, h, rx=10, fill=light, stroke=accent, sw=1.5))
    # 헤더 색 띠
    out.append(r(x, y, w, 36, rx=10, fill=accent, stroke=accent))
    out.append(r(x, y+26, w, 14, rx=0, fill=accent, stroke="none"))
    label = (icon + "  " if icon else "") + title
    out.append(t(x+w//2, y+23, label, size=12, fill="#fff", weight="bold"))
    for i, item in enumerate(items):
        yy = y + 50 + i * 22
        out.append(t(x+16, yy, "·  " + item, size=11, fill="#374151", anchor="start"))
    return "\n".join(out)

lines = []

# ── 배경 ──────────────────────────────────────────────────
lines.append(r(0, 0, W, H, rx=0, fill="#F8FAFC", stroke="none"))
# 미세 점선 격자
for i in range(0, W, 40):
    lines.append(f'<line x1="{i}" y1="0" x2="{i}" y2="{H}" stroke="#E2E8F0" stroke-width="0.5"/>')
for i in range(0, H, 40):
    lines.append(f'<line x1="0" y1="{i}" x2="{W}" y2="{i}" stroke="#E2E8F0" stroke-width="0.5"/>')
lines.append(r(0, 0, W, H, rx=0, fill="none", stroke="#CBD5E1", sw=2))

# ── 타이틀 ────────────────────────────────────────────────
lines.append(t(W//2, 38, "DIGGO", size=26, fill="#0F172A", weight="900"))
lines.append(t(W//2, 60, "굴착기 배차 플랫폼  —  System Architecture", size=13, fill="#64748B"))
lines.append(f'<line x1="60" y1="74" x2="{W-60}" y2="74" stroke="#E2E8F0" stroke-width="1"/>')

# ══════════════════════════════════════════════════════════
# ROW 1 — CLIENT LAYER
# ══════════════════════════════════════════════════════════
CY = 88
lines.append(r(30, CY, W-60, 190, rx=12, fill="#EFF6FF", stroke="#BFDBFE", sw=1.5))
lines.append(t(W//2, CY+18, "CLIENT  (Browser)", size=11, fill="#1D4ED8", weight="bold"))

# Pages
lines.append(card(50, CY+28, 300, 142,
    "Next.js Pages", [
        "App Router  (SSR / PPR)",
        "일감 목록 · 상세 · 등록",
        "소장 관리 · 마이페이지",
        "채팅 · 장부 · 관리자",
    ], accent="#3B82F6", light="#EFF6FF"))

# State
lines.append(card(370, CY+28, 300, 142,
    "Client State", [
        "Zustand  (Auth · Session · Role)",
        "TanStack Query v5",
        "무한스크롤 · prefetch",
        "staleTime / 낙관적 업데이트",
    ], accent="#6366F1", light="#EEF2FF"))

# Component
lines.append(card(690, CY+28, 280, 142,
    "Components", [
        "features/  (12개 도메인)",
        "ui/  (Avatar · Badge 등)",
        "Custom Hooks (useJobs …)",
        "createPortal  (카카오맵 z-index)",
    ], accent="#8B5CF6", light="#F5F3FF"))

# Kakao SDK (클라이언트)
lines.append(card(990, CY+28, 240, 142,
    "Kakao Map SDK", [
        "지도 렌더링",
        "주소 검색 UI",
        "SDK 동적 로드",
    ], accent="#F59E0B", light="#FFFBEB"))

# Bun / TypeScript / Tailwind
lines.append(r(1250, CY+28, 220, 142, rx=10, fill="#F0FDF4", stroke="#86EFAC", sw=1.5))
lines.append(r(1250, CY+28, 220, 36, rx=10, fill="#16A34A", stroke="#16A34A"))
lines.append(r(1250, CY+54, 220, 14, rx=0, fill="#16A34A", stroke="none"))
lines.append(t(1360, CY+51, "Dev Stack", size=12, fill="#fff", weight="bold"))
for i, item in enumerate(["Next.js 16", "TypeScript (strict)", "Tailwind CSS", "Bun"]):
    lines.append(t(1266, CY+84+i*22, "·  " + item, size=11, fill="#374151", anchor="start"))

# ── 화살표: Client ↕ Server ──────────────────────────────
lines.append(arrow_v(W//3, CY+190, CY+255, label="HTTPS / fetch", color="#6366F1"))
lines.append(arrow_v(W//3+60, CY+255, CY+195, color="#6366F1", dashed=True))

# WebSocket 표시
lines.append(arrow_v(W//3*2, CY+190, CY+255, color="#10B981", label="Realtime WS"))
lines.append(arrow_v(W//3*2+60, CY+255, CY+195, color="#10B981", dashed=True))

# ══════════════════════════════════════════════════════════
# ROW 2 — SERVER LAYER
# ══════════════════════════════════════════════════════════
SY = CY + 260
lines.append(r(30, SY, W-60, 170, rx=12, fill="#F5F3FF", stroke="#DDD6FE", sw=1.5))
lines.append(t(W//2, SY+18, "SERVER  (Next.js 16 · Vercel)", size=11, fill="#6D28D9", weight="bold"))

lines.append(card(50, SY+28, 340, 128,
    "App Router", [
        "SSR  /  PPR (Partial Prerender)",
        "Suspense wrapper  +  await params",
        "createClient()  →  'use no-store'",
    ], accent="#7C3AED", light="#F5F3FF"))

lines.append(card(410, SY+28, 340, 128,
    "API Routes  (/api)", [
        "jobs · applications · chats",
        "ledger · profile · reviews",
        "certifications · notifications",
        "address (카카오 프록시)",
    ], accent="#7C3AED", light="#F5F3FF"))

lines.append(card(770, SY+28, 340, 128,
    "Cache Layer", [
        '"use cache"  +  cacheComponents: true',
        "cacheLife('seconds' | 'minutes')",
        "cacheTag('jobs')  →  revalidateTag",
    ], accent="#7C3AED", light="#F5F3FF"))

lines.append(card(1130, SY+28, 340, 128,
    "Supabase Clients", [
        "createBrowserClient  (CSR)",
        "createServerClient   (SSR)",
        "createAdminClient    (SERVICE_ROLE)",
    ], accent="#7C3AED", light="#F5F3FF"))

# ── 화살표: Server → Supabase ────────────────────────────
lines.append(arrow_v(300, SY+170, SY+232, label="SDK / REST", color="#10B981"))
lines.append(arrow_v(700, SY+170, SY+232, color="#10B981"))

# 화살표: Server → Kakao REST
lines.append(arrow_h(W-60, W-60+20, SY+90, color="#F59E0B"))  # dummy for length calc
# Kakao API: 우측에 별도 박스 → 화살표로 연결
lines.append(arrow_v(1200, SY+170, SY+232, color="#F59E0B", label="HTTP"))

# ══════════════════════════════════════════════════════════
# ROW 3 — BACKEND LAYER
# ══════════════════════════════════════════════════════════
BY = SY + 236
lines.append(r(30, BY, 1070, 180, rx=12, fill="#ECFDF5", stroke="#A7F3D0", sw=1.5))
lines.append(t(565, BY+18, "SUPABASE  (BaaS Backend)", size=11, fill="#047857", weight="bold"))

lines.append(card(50, BY+28, 230, 136,
    "Auth", [
        "이메일 / 비밀번호",
        "JWT 세션 관리",
        "handle_new_user 트리거",
        "RLS  (역할별 접근제어)",
    ], accent="#059669", light="#ECFDF5"))

lines.append(card(298, BY+28, 300, 136,
    "PostgreSQL  DB", [
        "profiles · jobs · applications",
        "chat_rooms · messages",
        "reviews · ledger_expenses",
        "notifications · certifications",
    ], accent="#059669", light="#ECFDF5"))

lines.append(card(616, BY+28, 216, 136,
    "Realtime", [
        "채팅 메시지 구독",
        "알림 실시간 구독",
        "WebSocket 채널",
    ], accent="#059669", light="#ECFDF5"))

lines.append(card(850, BY+28, 220, 136,
    "Storage", [
        "avatars/  (프로필 사진)",
        "certifications/  (서류)",
        "Signed URL 발급",
    ], accent="#059669", light="#ECFDF5"))

# Kakao REST (우측 독립 박스)
lines.append(r(1120, BY, 350, 180, rx=12, fill="#FFFBEB", stroke="#FDE68A", sw=1.5))
lines.append(t(1295, BY+18, "EXTERNAL SERVICES", size=11, fill="#B45309", weight="bold"))
lines.append(card(1140, BY+28, 310, 136,
    "Kakao Map REST API", [
        "주소 → 좌표 변환",
        "/api/address/search 프록시",
        "서버 전용 API 키 (비공개)",
    ], accent="#F59E0B", light="#FFFBEB"))

# ── 범례 ─────────────────────────────────────────────────
LY = BY + 192
lines.append(r(30, LY, W-60, 36, rx=8, fill="#F1F5F9", stroke="#E2E8F0"))
for i, (col, lbl) in enumerate([
    ("#3B82F6", "Client Layer"),
    ("#7C3AED", "Server Layer"),
    ("#059669", "Supabase Backend"),
    ("#F59E0B", "External Services"),
    ("#94A3B8", "HTTP / API"),
    ("#6366F1", "Realtime WebSocket"),
]):
    x0 = 80 + i * 230
    lines.append(f'<circle cx="{x0}" cy="{LY+18}" r="5" fill="{col}"/>')
    lines.append(t(x0+10, LY+22, lbl, size=10, fill="#64748B", anchor="start"))

# ══════════════════════════════════════════════════════════
# SVG 조립
# ══════════════════════════════════════════════════════════
svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <style>
      text {{ font-family: -apple-system, "Segoe UI", sans-serif; }}
    </style>
  </defs>
  {chr(10).join(lines)}
</svg>'''

os.makedirs("/Users/saminjae/diggo/docs", exist_ok=True)
path = "/Users/saminjae/diggo/docs/architecture_portfolio.svg"
with open(path, "w", encoding="utf-8") as f:
    f.write(svg)
print(f"SVG 완료: {path}  ({W}x{H}px)")
