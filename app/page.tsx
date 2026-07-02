import Link from "next/link";
import Image from "next/image";
import { ExcavatorIcon } from "@/components/ui/ExcavatorIcon";
import { AnimatedHero } from "@/components/features/home/AnimatedHero";
import { AnimatedStats } from "@/components/features/home/AnimatedStats";
import { AnimatedFeatures } from "@/components/features/home/AnimatedFeatures";
import { AnimatedSplitCTA } from "@/components/features/home/AnimatedSplitCTA";
import { NavButtons } from "@/components/features/home/NavButtons"
import { FooterAuthLink } from "@/components/features/home/FooterAuthLink";


export default function HomePage() {
  return (
    <div className="bg-[#f5f5f0] text-stone-900 min-h-screen">

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ExcavatorIcon className="w-10 h-8 text-blue-400" />
            <span className="text-lg font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/jobs"
              className="text-sm text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              일감 보기
            </Link>
            <NavButtons />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">

        {/* 배경 사진 — priority로 LCP 조기 로드, Next.js Image로 WebP 자동 변환 */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={80}
            style={{
              objectFit: "cover",
              objectPosition: "center 60%",
              filter: "blur(8px)",
              transform: "scale(1.08)",
            }}
          />
        </div>

        {/* 파란 오버레이 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,20,60,0.68) 0%, rgba(29,78,216,0.52) 60%, rgba(8,20,60,0.62) 100%)",
          }}
        />

        {/* 격자 패턴 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* 애니메이션 히어로 콘텐츠 */}
        <AnimatedHero />

        {/* 스크롤 유도 화살표 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-blue-400/70 animate-bounce">
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </section>

      {/* STATS */}
      <div className="border-y border-blue-200 bg-white">
        <AnimatedStats />
      </div>

      {/* FEATURES */}
      <section className="bg-slate-50 max-w-full px-6 pt-28 pb-16">
        <AnimatedFeatures />
      </section>

      {/* SPLIT CTA */}
      <AnimatedSplitCTA />

      {/* FOOTER */}
      <footer className="border-t border-blue-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ExcavatorIcon className="w-7 h-5 text-blue-500" />
            <span className="text-sm font-black tracking-tight text-blue-900">
              Diggo<span className="text-blue-500">.</span>
            </span>
          </div>
          <p className="text-blue-700/50 text-xs text-center">
            굴착기 기사와 소장을 위한 배차 플랫폼
          </p>
          <div className="flex items-center gap-6 text-xs text-blue-700/50">
            <Link href="/jobs" className="hover:text-blue-700 transition-colors">
              일감 보기
            </Link>
            <FooterAuthLink />
          </div>
        </div>
      </footer>
    </div>
  );
}
