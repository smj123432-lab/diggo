# Diggo — 굴착기 배차 플랫폼

## 프로젝트 개요

굴착기 기사와 소장을 연결하는 배차 플랫폼.
기사는 일감을 찾고, 소장은 검증된 기사를 구한다.
전자장부 기능으로 수기 장부 문제를 해결한다.

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (DB, Auth, Realtime, Storage)
- Zustand (클라이언트 상태관리 - 유저 세션, role)
- TanStack Query v5 (서버 상태관리, 무한스크롤, 캐싱)
- Bun (패키지 매니저, 런타임)
- Vercel (배포)
- 카카오맵 API (주소 검색, 지도 렌더링)

## 주요 명령어

- 개발 서버 실행: bun dev
- 빌드: bun run build
- 패키지 설치: bun add [패키지명]
- 타입 체크: bun run type-check

## 폴더 구조

```
diggo/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 로그인, 회원가입
│   ├── jobs/               # 일감 목록, 상세
│   ├── manager/            # 소장 전용 페이지
│   ├── mypage/             # 마이페이지, 장부
│   ├── chats/              # 채팅
│   ├── admin/              # 관리자
│   └── api/                # API Routes
├── components/             # 공통 컴포넌트
│   ├── ui/                 # 기본 UI 컴포넌트
│   └── features/           # 기능별 컴포넌트
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티
│   ├── supabase/           # Supabase 클라이언트
│   └── utils/              # 헬퍼 함수
├── store/                  # Zustand 스토어
├── types/                  # TypeScript 타입 정의
├── PLAN.md                 # 전체 기획서
└── CLAUDE.md               # 이 파일
```

## 사용자 역할 (role)

- driver: 굴착기 기사
- manager: 소장 (일감 등록자)
- admin: 관리자

## 장비 종류 (equipment_code)

- 008: 008 (미니)
- 017: 017
- 035: 035
- 02: 02
- 3w: 3w (휠)
- 6w: 6w (휠)
- 8w: 8w (휠)
- 10t: 10t

## 일감 유형 (job_type)

- civil: 일반 토목
- demolition: 철거

## 코딩 규칙

- 항상 전체 코드를 작성한다 (스니펫, 생략 금지)
- TypeScript strict 모드 사용
- 컴포넌트는 함수형으로 작성
- 서버 컴포넌트와 클라이언트 컴포넌트를 명확히 구분
- 'use client' 는 꼭 필요한 경우에만 사용
- 에러 처리는 항상 포함
- 주석은 한국어로 작성
- API Routes는 app/api/ 하위에 작성
- Supabase 클라이언트는 lib/supabase/ 에서 import

## 캐싱 전략

- 일감 목록: revalidate 30초
- 일감 상세: ISR 1분
- 장부/마이페이지: no-store (개인 데이터)
- 채팅/알림: Supabase Realtime
- 소장 일감 등록 후: revalidatePath('/jobs') 호출

## Supabase 관련

- 클라이언트 사이드: createBrowserClient
- 서버 사이드: createServerClient
- RLS 정책으로 역할별 접근 제어
- Realtime으로 채팅, 알림 구현

## 작업 시 참고사항

- PLAN.md에 전체 기획, DB 설계, API 설계가 있다
- MVP 범위를 먼저 완성하고 v2 기능은 나중에 추가
- 페이지 단위로 하나씩 완성한다
- 작업 전 반드시 PLAN.md를 참고한다
