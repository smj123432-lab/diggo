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

- 신규 파일 작성 시: 항상 전체 코드 작성
- 기존 파일 수정 시: 수정 부분만 작성 (토큰 절약)
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

## 브랜치 전략

- main: 배포용. 직접 커밋 금지. Vercel 자동 배포 연결.
- dev: 개발 통합 브랜치. 기능 완성 후 여기에 머지.
- feat/기능명: 기능 개발 (예: feat/login, feat/job-list)
- fix/버그명: 버그 수정 (예: fix/auth-redirect)

## 커밋 컨벤션

- feat: 새 기능
- fix: 버그 수정
- style: UI/스타일 수정
- refactor: 리팩토링
- chore: 설정, 패키지
- docs: 문서 수정
- 예시: feat: 일감 목록 무한스크롤 구현
- 커밋 메시지는 한국어로 작성

## 컴포넌트 규칙

- 서버 컴포넌트 기본, 'use client'는 꼭 필요할 때만
- props 타입은 interface로 정의 (type 말고)
- 컴포넌트 파일 상단에 역할 한 줄 주석 작성
- 스타일은 Tailwind만 사용 (인라인 style 금지)
- 로딩 상태와 에러 상태 UI 항상 포함

## 네이밍 규칙

- 컴포넌트 파일: PascalCase (JobCard.tsx)
- 훅 파일: camelCase + use 접두사 (useJobList.ts)
- 유틸 함수: camelCase (formatDate.ts)
- 타입/인터페이스: PascalCase (interface Profile)
- 상수: SCREAMING_SNAKE_CASE (EQUIPMENT_LABELS)
- DB 컬럼: snake_case (manager_id, pay_amount)
- 주석: 한국어

## 에러 처리 패턴

- API Route는 항상 try/catch 사용
- 에러 응답: { error: '한국어 메시지' } + HTTP 상태코드
- 성공 응답: { data: ... } (목록은 { data, count, page, limit })
- 401: 로그인 필요, 403: 권한 없음, 404: 없음, 409: 중복

## 금지 사항

- any 타입 사용 금지 (unknown 사용)
- console.log 금지 (console.error만 허용)
- 인라인 style 금지
- 신규 파일 외 전체 코드 불필요하게 반복 금지
- 하드코딩 금지 (상수는 types/index.ts에 정의)
- TODO 주석 남기기 금지 (구현하거나 삭제)

## 작업 시작 전 체크리스트

- 반드시 작업 전 브랜치 확인: git branch
- 새 기능은 반드시 feat/기능명 브랜치에서 작업
- main, dev 브랜치에 직접 커밋 금지
- 브랜치 없이 작업 요청하면 먼저 브랜치 생성 안내해줘

## 언어

- 모든 응답과 주석은 한국어로 작성한다

## 트러블슈팅

### Supabase 회원가입 500 에러 — Database error saving new user

**증상**: `POST /auth/v1/signup` → 500, `{"error_code":"unexpected_failure","msg":"Database error saving new user"}`

**원인**: `handle_new_user` 트리거 함수에 `search_path`가 지정되지 않아, Supabase Auth 환경에서 `profiles` 테이블을 찾지 못해 실패.

**해결**: 트리거 함수 정의에 `set search_path = public` 추가

```sql
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
...
$$;
```

> Supabase에서 `security definer` 함수는 반드시 `set search_path = public`을 명시해야 Auth 환경에서 정상 동작한다.

### Supabase profiles 조회 403 에러

**증상**: `GET /rest/v1/profiles` → 403, role이 null이라 UI 업데이트 안 됨

**원인**: RLS 정책만 있고 `anon`/`authenticated` 롤에 테이블 SELECT 권한이 없음. SQL로 직접 테이블 생성 시 권한을 별도로 부여해야 함.

**해결**: Supabase SQL Editor에서 실행
```sql
grant select on profiles to anon, authenticated;
```

> Supabase UI로 테이블 생성 시 권한이 자동 부여되지만, SQL로 직접 생성하면 반드시 수동으로 grant 해야 한다.

### sonner 토스트에서 줄바꿈

**증상**: `\n` 문자가 줄바꿈으로 렌더링되지 않음

**해결**: 문자열 대신 JSX 사용
```tsx
toast.error(<>첫 번째 줄<br />두 번째 줄</>)
```

### AuthInitializer 전역 초기화 패턴

Supabase 인증 구독(`useAuth`)은 앱 전체에서 한 번만 호출해야 중복 API 요청이 없다.
`components/features/auth/AuthInitializer.tsx`를 만들고 `providers.tsx`에 삽입.
나머지 컴포넌트는 `useAuthStore()`로 Zustand 상태만 읽는다.

### useAuth — isLoading 빠른 해제

`onAuthStateChange`가 로컬 세션을 즉시 확인하므로, 프로필 fetch 완료를 기다리지 않고 세션 확인 직후 `setIsLoading(false)` 호출.
프로필(role)은 백그라운드에서 별도 fetch해 store에 업데이트한다.
