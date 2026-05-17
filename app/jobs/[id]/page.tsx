// 일감 상세 — ISR 1분
export const revalidate = 60

interface Props {
  params: { id: string }
}

export default function JobDetailPage({ params }: Props) {
  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">일감 상세</h1>
      <p className="text-gray-400 text-sm">ID: {params.id}</p>
      <p className="text-gray-500 mt-2">구현 예정</p>
    </main>
  )
}
