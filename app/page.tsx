import Link from 'next/link'

const features = [
  {
    num: '01',
    title: '정확한 배차',
    desc: '장비 종류, 작업 일자, 지급 조건까지. 소장이 일감을 올리면 맞는 기사가 지원한다. 검토 → 채팅 → 수락까지 한 흐름으로.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    num: '02',
    title: '상호 신뢰 검증',
    desc: '일 끝나면 기사와 소장이 서로 평가한다. 평점은 프로필에 쌓이고, 좋은 기사는 인증 뱃지를 받는다. 경력을 속일 수 없다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: '전자장부',
    desc: '작업 완료 시 수입이 자동으로 기록된다. 유류비, 소모품 지출을 직접 입력하면 월별 순수익을 한눈에 확인. 수기 장부는 이제 그만.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
]

const stats = [
  { num: '1,200+', label: '등록 기사' },
  { num: '380+', label: '등록 소장' },
  { num: '4.8', label: '평균 평점' },
]

export default function HomePage() {
  return (
    <div className="bg-[#080808] text-white min-h-screen">

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#080808]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-black tracking-tight">
            Diggo<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-6">
            <Link href="/jobs" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              일감 보기
            </Link>
            <Link
              href="/login"
              className="text-sm border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-primary hover:bg-primary-dark text-black font-bold px-4 py-2 rounded-lg transition-colors"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 60% at 50% -5%, rgba(245, 158, 11, 0.18) 0%, transparent 70%),
            linear-gradient(rgba(245, 158, 11, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 64px 64px, 64px 64px',
        }}
      >
        {/* 배경 노이즈 질감 */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
          {/* 뱃지 */}
          <div className="inline-flex items-center gap-2.5 border border-primary/20 bg-primary/8 px-4 py-2 rounded-full text-primary/80 text-xs font-mono tracking-widest uppercase mb-12">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            굴착기 배차 플랫폼
          </div>

          {/* 헤드라인 */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.05] tracking-tight mb-8">
            경력대로 일하고,
            <br />
            <span className="text-primary">약속대로 받는다.</span>
          </h1>

          {/* 서브텍스트 */}
          <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-14">
            나이가 아닌 실력으로 선택받는 배차 플랫폼.
            <br />
            검증된 기사와 신뢰할 수 있는 소장을 잇습니다.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup?role=driver"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.4)]"
            >
              기사로 시작하기
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/signup?role=manager"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-white text-base px-8 py-4 rounded-xl transition-all duration-200 hover:bg-white/[0.03]"
            >
              소장으로 시작하기
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        {/* 하단 스크롤 힌트 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 text-xs font-mono tracking-widest animate-bounce">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </section>

      {/* STATS */}
      <div className="border-y border-white/5 bg-[#0C0C0C]">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-3 divide-x divide-white/5">
          {stats.map(({ num, label }) => (
            <div key={label} className="text-center px-4">
              <div className="font-mono text-3xl sm:text-4xl font-medium text-primary tabular-nums">
                {num}
              </div>
              <div className="text-gray-500 text-sm mt-2 tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-32">
        <div className="mb-16">
          <p className="font-mono text-primary/60 text-xs tracking-widest uppercase mb-4">핵심 기능</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            현장에서 필요한 것만
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map(({ num, title, desc, icon }) => (
            <div
              key={num}
              className="group relative border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/20 rounded-2xl p-8 transition-all duration-300"
            >
              {/* amber 왼쪽 라인 */}
              <div className="absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-xs text-primary/50 tracking-widest">{num}</span>
                <span className="text-gray-600 group-hover:text-primary/60 transition-colors duration-300">
                  {icon}
                </span>
              </div>

              <div className="w-6 h-px bg-primary/40 mb-6 group-hover:w-10 transition-all duration-300" />

              <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SPLIT CTA */}
      <section className="border-t border-white/5">
        <div className="grid md:grid-cols-2">
          {/* 기사 */}
          <div className="relative bg-primary p-14 sm:p-20 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative">
              <p className="font-mono text-black/50 text-xs tracking-widest uppercase mb-8">기사라면</p>
              <h3 className="text-3xl sm:text-4xl font-black text-black leading-tight mb-5">
                나이 말고<br />실력으로<br />평가받으세요.
              </h3>
              <p className="text-black/60 text-sm leading-relaxed mb-10 max-w-xs">
                평점과 인증 뱃지로 경력을 증명하고, 전자장부로 수입을 투명하게 관리합니다.
              </p>
              <Link
                href="/signup?role=driver"
                className="inline-flex items-center gap-2 bg-black text-primary font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-black/80 transition-colors"
              >
                기사로 가입하기
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* 소장 */}
          <div className="relative bg-[#0F0F0F] border-l border-white/5 p-14 sm:p-20 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(245,158,11,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.8) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative">
              <p className="font-mono text-primary/40 text-xs tracking-widest uppercase mb-8">소장이라면</p>
              <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-5">
                검증된 기사를<br />직접 골라서<br />쓰세요.
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-xs">
                경력을 속인 기사로 인한 사고 걱정 없이, 평점과 뱃지로 검증된 기사를 선택합니다.
              </p>
              <Link
                href="/signup?role=manager"
                className="inline-flex items-center gap-2 border border-white/10 hover:border-primary/30 text-white hover:text-primary font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200"
              >
                소장으로 가입하기
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-black tracking-tight">
            Diggo<span className="text-primary">.</span>
          </span>
          <p className="text-gray-600 text-xs text-center">
            굴착기 기사와 소장을 위한 배차 플랫폼
          </p>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <Link href="/jobs" className="hover:text-gray-400 transition-colors">일감 보기</Link>
            <Link href="/login" className="hover:text-gray-400 transition-colors">로그인</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
