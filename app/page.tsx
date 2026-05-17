import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Diggo</h1>
          <p className="mt-2 text-lg text-gray-600">굴착기 배차 플랫폼</p>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed">
          경력과 실력으로 인정받는 배차 플랫폼.
          <br />
          전자장부로 수입을 한눈에 관리하세요.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/jobs"
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            일감 보기
          </Link>
          <Link
            href="/login"
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            로그인
          </Link>
        </div>
      </div>
    </main>
  )
}
