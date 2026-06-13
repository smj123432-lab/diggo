"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}

function CountUp({ to, decimals = 0, suffix = "", duration = 1.8 }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const totalSteps = 60;
    const stepTime = (duration * 1000) / totalSteps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      /* easeOut 커브 적용 */
      const progress = 1 - Math.pow(1 - step / totalSteps, 3);
      const current = parseFloat((to * progress).toFixed(decimals));

      if (step >= totalSteps) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, to, duration, decimals]);

  const formatted =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.floor(count).toLocaleString("ko-KR");

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}

const stats = [
  { to: 1200, suffix: "+", label: "등록 기사" },
  { to: 380, suffix: "+", label: "등록 소장" },
  { to: 4.8, decimals: 1, suffix: "", label: "평균 평점" },
];

export function AnimatedStats() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-3 divide-x divide-blue-100">
      {stats.map(({ to, suffix, decimals, label }) => (
        <div key={label} className="text-center px-4">
          <div className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 tabular-nums whitespace-nowrap">
            <CountUp to={to} suffix={suffix} decimals={decimals} />
          </div>
          <div className="text-blue-700/60 text-sm mt-2 tracking-wide">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
