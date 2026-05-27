"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { ExcavatorIcon } from "@/components/ui/ExcavatorIcon";

const arrowPath =
  "M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z";

const gridStyle = (color: string) => ({
  backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
  backgroundSize: "32px 32px",
});

export function AnimatedSplitCTA() {
  const { role } = useAuthStore();
  const router = useRouter();

  const handleDriverClick = () => {
    if (role === "manager") {
      toast.error(
        "소장님, 이미 로그인되어 있어요! 공고 올리기로 이동해 보세요.",
      );
      return;
    }
    router.push(role === "driver" ? "/jobs" : "/signup?role=driver");
  };

  const handleManagerClick = () => {
    if (role === "driver") {
      toast.error("기사님, 이미 로그인되어 있어요! 일감 찾기로 이동해 보세요.");
      return;
    }
    router.push(role === "manager" ? "/jobs/new" : "/signup?role=manager");
  };

  return (
    <section className="border-t border-blue-200">
      <div className="grid md:grid-cols-2 overflow-hidden">
        {/* 기사 — 왼쪽에서 슬라이드인 */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative bg-brand-blue-dark p-14 sm:p-20 overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={gridStyle("rgba(0,0,0,0.6)")}
          />
          <ExcavatorIcon className="absolute right-8 bottom-8 w-40 h-28 text-white/5" />
          <div className="relative">
            <p className="font-mono text-white/40 text-xs tracking-widest uppercase mb-8">
              기사라면
            </p>
            <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-5">
              나이 말고
              <br />
              실력으로
              <br />
              평가받으세요
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-10 max-w-xs">
              평점과 인증 뱃지로 경력을 증명하고, 전자장부로 수입을 투명하게
              관리합니다
            </p>
            <button
              onClick={handleDriverClick}
              className="group inline-flex items-center gap-2 bg-white text-brand-blue-deep font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-colors"
            >
              {role === "driver" ? "일감 찾으러 가기" : "기사로 가입하기"}
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d={arrowPath} clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* 소장 — 오른쪽에서 슬라이드인 */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative bg-slate-50 border-l border-blue-200 p-14 sm:p-20 lg:pl-28 overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={gridStyle("rgba(59,130,246,0.05)")}
          />
          <div className="relative">
            <p className="font-mono text-brand-blue text-xs tracking-widest uppercase mb-8">
              소장이라면
            </p>
            <h3 className="text-3xl sm:text-4xl font-black text-stone-900 leading-tight mb-5">
              검증된 기사를
              <br />
              직접 골라서
              <br />
              쓰세요
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-xs">
              경력을 속인 기사로 인한 사고 걱정 없이, 평점과 뱃지로 검증된
              기사를 선택합니다
            </p>
            <button
              onClick={handleManagerClick}
              className="group inline-flex items-center gap-2 bg-brand-blue-dark hover:bg-brand-blue-deep text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-colors"
            >
              {role === "manager" ? "일감 올리러 가기" : "소장으로 가입하기"}
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d={arrowPath} clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
