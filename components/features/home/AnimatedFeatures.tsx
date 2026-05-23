"use client";

import { motion } from "framer-motion";

const features = [
  {
    num: "01",
    title: "정확한 배차",
    desc: "장비 종류, 작업 일자, 지급 조건까지. 소장이 일감을 올리면 맞는 기사가 지원한다. 검토 → 채팅 → 수락까지 한 흐름으로.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "상호 신뢰 검증",
    desc: "일 끝나면 기사와 소장이 서로 평가한다. 평점은 프로필에 쌓이고, 좋은 기사는 인증 뱃지를 받는다. 경력을 속일 수 없다.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "전자장부",
    desc: "작업 완료 시 수입이 자동으로 기록된다. 유류비, 소모품 지출을 직접 입력하면 월별 순수익을 한눈에 확인. 수기 장부는 이제 그만.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export function AnimatedFeatures() {
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-16"
      >
        <p className="font-mono text-blue-500 text-xs tracking-widest uppercase mb-4">
          핵심 기능
        </p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900">
          현장에서 필요한 것만
        </h2>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {features.map(({ num, title, desc, icon }) => (
          <motion.div
            key={num}
            variants={cardVariant}
            className="group relative border border-slate-200 bg-white hover:border-blue-400 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.13)] rounded-2xl p-8 transition-all duration-300"
          >
            <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

            <div className="flex items-start justify-between mb-8">
              <span className="font-mono text-xs text-blue-500 tracking-widest">
                {num}
              </span>
              <span className="text-blue-300 group-hover:text-blue-500 transition-colors duration-300">
                {icon}
              </span>
            </div>

            <div className="w-6 h-0.5 bg-blue-200 mb-6 group-hover:w-10 group-hover:bg-blue-400 transition-all duration-300" />

            <h3 className="text-lg font-bold text-stone-900 mb-3">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed break-keep">{desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
