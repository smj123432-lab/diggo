"use client";

import { motion } from "framer-motion";

export function AnimatedHero() {

  return (
    <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
      {/* 뱃지 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-flex items-center gap-2.5 border border-blue-400/40 bg-blue-500/10 backdrop-blur-sm px-4 py-2 rounded-full text-blue-300 text-xs font-mono tracking-widest uppercase mb-12"
      >
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
        굴착기 배차 플랫폼
      </motion.div>

      {/* 헤드라인 */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
        className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.05] tracking-tight mb-8 text-white"
      >
        경력대로 일하고
        <br />
        <span className="text-blue-400">약속대로 받는다</span>
      </motion.h1>

      {/* 서브텍스트 + 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.28 }}
      >
        <p className="text-slate-300 text-base sm:text-lg max-w-lg mx-auto leading-loose tracking-wide mb-14">
          나이가 아닌 실력으로 선택받는 배차 플랫폼
          <br />
          검증된 기사와 신뢰할 수 있는 소장을 잇습니다
        </p>

      </motion.div>
    </div>
  );
}
