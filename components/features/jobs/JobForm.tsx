"use client";

// 일감 등록 폼 — 소장 전용
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EquipmentCode, JobType, PayDueType, WorkDuration } from "@/types";
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_CODES_LIST,
  JOB_TYPE_LABELS,
  PAY_DUE_LABELS,
  PAY_DUE_TYPES_LIST,
  WORK_DURATION_LABELS,
  WORK_DURATION_LIST,
} from "@/types";
import { AddressSearch } from "./AddressSearch";

interface FormState {
  title: string;
  job_type: JobType | "";
  equipment_codes: EquipmentCode[];
  payments: Partial<Record<EquipmentCode, { amount: string; days: string }>>;
  description: string;
  attachments: string;
  caution: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  work_date: string;
  work_duration: WorkDuration | "";
  pay_due_type: PayDueType | "";
}

const INITIAL: FormState = {
  title: "",
  job_type: "",
  equipment_codes: [],
  payments: {},
  description: "",
  attachments: "",
  caution: "",
  location: "",
  latitude: null,
  longitude: null,
  work_date: "",
  work_duration: "",
  pay_due_type: "",
};

// 섹션 구분선
function Divider() {
  return <div className="border-b border-gray-100 my-5" />;
}

// 섹션 레이블
function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="text-sm font-bold text-gray-800 mb-3">
      {children}
      {required && <span className="text-brand-blue ml-0.5">*</span>}
    </p>
  );
}

// 공통 인풋 클래스
const inputCls =
  "w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition";

interface JobFormProps {
  mode?: "create" | "edit";
  jobId?: string;
  initialValues?: Partial<FormState>;
}

export function JobForm({
  mode = "create",
  jobId,
  initialValues,
}: JobFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initialValues ? { ...INITIAL, ...initialValues } : INITIAL,
  );
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: keyof FormState, value: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleEquipment = (code: EquipmentCode) =>
    setForm((f) => {
      if (f.equipment_codes.includes(code)) {
        const { [code]: _r, ...rest } = f.payments; // eslint-disable-line @typescript-eslint/no-unused-vars
        return {
          ...f,
          equipment_codes: f.equipment_codes.filter((c) => c !== code),
          payments: rest,
        };
      }
      return {
        ...f,
        equipment_codes: [...f.equipment_codes, code],
        payments: { ...f.payments, [code]: { amount: "", days: "" } },
      };
    });

  const setPayment = (
    code: EquipmentCode,
    field: "amount" | "days",
    value: string,
  ) =>
    setForm((f) => ({
      ...f,
      payments: {
        ...f.payments,
        [code]: {
          ...f.payments[code],
          [field]:
            field === "amount"
              ? formatPayAmount(value)
              : value.replace(/[^0-9]/g, ""),
        },
      },
    }));

  const allAmountsFilled =
    form.equipment_codes.length > 0 &&
    form.equipment_codes.every((code) => Boolean(form.payments[code]?.amount));

  const isValid = Boolean(
    form.title.trim() &&
    form.job_type &&
    form.equipment_codes.length > 0 &&
    allAmountsFilled &&
    form.description.trim() &&
    form.location &&
    form.latitude !== null &&
    form.work_date &&
    form.pay_due_type,
  );

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    const payload = {
      title: form.title.trim(),
      job_type: form.job_type,
      equipment_codes: form.equipment_codes,
      description: form.description.trim(),
      attachments: form.attachments.trim() || null,
      caution: form.caution.trim() || null,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      pay_amounts: Object.fromEntries(
        form.equipment_codes.map((code) => [
          code,
          parseInt((form.payments[code]?.amount ?? "0").replace(/,/g, ""), 10),
        ]),
      ),
      work_days: Object.fromEntries(
        form.equipment_codes.map((code) => [
          code,
          parseInt(form.payments[code]?.days ?? "0", 10),
        ]),
      ),
      work_date: form.work_date,
      work_duration: form.work_duration || null,
      pay_due_type: form.pay_due_type,
    };
    try {
      const res = await fetch(
        mode === "edit" ? `/api/jobs/${jobId}` : "/api/jobs",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          err.error ?? (mode === "edit" ? "수정 실패" : "등록 실패"),
        );
      }
      toast.success(
        mode === "edit" ? "일감이 수정되었습니다." : "일감이 등록되었습니다.",
      );
      router.push(mode === "edit" ? `/jobs/${jobId}` : "/jobs");
      router.refresh();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : mode === "edit"
            ? "일감 수정에 실패했습니다."
            : "일감 등록에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPayAmount = (v: string) => {
    const num = v.replace(/[^0-9]/g, "");
    return num ? parseInt(num, 10).toLocaleString() : "";
  };

  return (
    <>
      {/* 싱글 카드 */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        {/* ── 일감 유형 ── */}
        <div>
          <Label required>일감 유형</Label>
          <div className="grid grid-cols-2 gap-2.5">
            {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set("job_type", type)}
                className={`py-3.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  form.job_type === type
                    ? "border-brand-blue bg-brand-blue text-white shadow-sm"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {JOB_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* ── 필요 장비 (복수 선택) ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Label required>필요 장비</Label>
            <span className="text-xs text-gray-400 -mt-3">복수 선택 가능</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {EQUIPMENT_CODES_LIST.map((code) => {
              const selected = form.equipment_codes.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleEquipment(code)}
                  className={`py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    selected
                      ? "border-brand-blue bg-brand-blue text-white shadow-sm"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {EQUIPMENT_LABELS[code]}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* ── 일감 제목 ── */}
        <div>
          <Label required>일감 제목</Label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="예) 논현동 신축 현장 기초 굴착"
            maxLength={60}
            className={inputCls}
          />
        </div>

        <Divider />

        {/* ── 작업 내용 ── */}
        <div>
          <Label required>작업 내용</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="작업 내용, 현장 상황, 진입로 등 기사에게 필요한 정보를 적어주세요."
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* ── 추가 정보 (일감 유형 선택 시 표시) ── */}
        {form.job_type && (
          <>
            <Divider />
            <div>
              {/* 대제목 + 뱃지 인라인 배치 */}
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-bold text-gray-800">
                  필요 어태치먼트
                </p>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  {form.job_type === "civil"
                    ? "토목 추가 정보"
                    : "철거 추가 정보"}
                </span>
              </div>
              <input
                type="text"
                value={form.attachments}
                onChange={(e) => set("attachments", e.target.value)}
                placeholder={
                  form.job_type === "civil"
                    ? "예) 채버켓, 리퍼, 대바가지, 집게 등"
                    : "예) 뿌레카, 크라샤, 집게 등"
                }
                className={`${inputCls} mb-5`}
              />
              <Label>주의사항</Label>
              <input
                type="text"
                value={form.caution}
                onChange={(e) => set("caution", e.target.value)}
                placeholder="예) 유리섬유 주의, 인접 건물 보양 필수"
                className={inputCls}
              />
            </div>
          </>
        )}

        <Divider />

        {/* ── 작업 주소 ── */}
        <div>
          <Label required>작업 주소</Label>
          <button
            type="button"
            onClick={() => setShowAddressSearch(true)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm text-left transition-all ${
              form.location
                ? "border-brand-blue bg-blue-50 text-gray-900 font-medium"
                : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            <svg
              className={`w-4 h-4 shrink-0 ${form.location ? "text-brand-blue" : "text-gray-300"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="flex-1 truncate">
              {form.location || "주소를 검색해 주세요"}
            </span>
            {form.location && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  set("location", "");
                  set("latitude", null);
                  set("longitude", null);
                }}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            )}
          </button>
        </div>

        <Divider />

        {/* ── 작업 일자 + 작업 기간 ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>작업 일자</Label>
            <input
              type="date"
              value={form.work_date}
              min={
                mode === "edit"
                  ? undefined
                  : new Date().toISOString().split("T")[0]
              }
              onChange={(e) => set("work_date", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <Label>
              {form.equipment_codes.length > 1 ? "총 작업 기간" : "작업 기간"}
            </Label>
            <select
              value={form.work_duration}
              onChange={(e) =>
                set("work_duration", e.target.value as WorkDuration)
              }
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition bg-white appearance-none cursor-pointer"
            >
              <option value="">미정</option>
              {WORK_DURATION_LIST.map((d) => (
                <option key={d} value={d}>
                  {WORK_DURATION_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Divider />

        {/* ── 지급 금액 (장비별 동적 생성) + 지급 예정일 ── */}
        <div className="grid grid-cols-1 gap-4">
          {form.equipment_codes.length === 0 ? (
            <div className="col-span-full">
              <Label required>지급 금액 (대당)</Label>
              <div className="px-4 py-3.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 text-center">
                장비를 먼저 선택해 주세요
              </div>
            </div>
          ) : (
            form.equipment_codes.map((code) => (
              <div
                key={code}
                className="bg-slate-50 border border-slate-200 rounded-xl p-5"
              >
                {/* 장비 코드 타이틀 */}
                <p className="text-sm font-bold text-slate-700 mb-4">{code}</p>
                {/* 지급 금액 | 작업 기간 — 항상 2열 5:5 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">
                      지급 금액 <span className="text-brand-blue">*</span>
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.payments[code]?.amount ?? ""}
                        onChange={(e) =>
                          setPayment(code, "amount", e.target.value)
                        }
                        placeholder="0"
                        className="w-full pl-3 pr-7 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        원
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">
                      작업 기간 <span className="text-brand-blue">*</span>
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.payments[code]?.days ?? ""}
                        onChange={(e) =>
                          setPayment(code, "days", e.target.value)
                        }
                        placeholder="0"
                        className="w-full pl-3 pr-7 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        일
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="col-span-full">
            <Label required>지급 예정일</Label>
            <select
              value={form.pay_due_type}
              onChange={(e) =>
                set("pay_due_type", e.target.value as PayDueType)
              }
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition bg-white appearance-none cursor-pointer"
            >
              <option value="">선택</option>
              {PAY_DUE_TYPES_LIST.map((type) => (
                <option key={type} value={type}>
                  {PAY_DUE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 등록 버튼 — 카드 바깥 ── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`w-full mt-4 py-4 rounded-xl font-bold text-base transition-all ${
          isValid && !isSubmitting
            ? "bg-brand-blue hover:bg-brand-blue-dark text-white shadow-md active:scale-[0.98]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {mode === "edit" ? "수정 중..." : "등록 중..."}
          </span>
        ) : mode === "edit" ? (
          "수정 완료"
        ) : (
          "일감 등록하기"
        )}
      </button>

      {/* 주소 검색 모달 */}
      {showAddressSearch && (
        <AddressSearch
          onSelect={(result) => {
            set("location", result.address_name);
            set("latitude", result.latitude);
            set("longitude", result.longitude);
            setShowAddressSearch(false);
          }}
          onClose={() => setShowAddressSearch(false)}
        />
      )}
    </>
  );
}
