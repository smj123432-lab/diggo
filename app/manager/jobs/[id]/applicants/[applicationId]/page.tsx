interface Props {
  params: { id: string; applicationId: string }
}

export default function ApplicantDetailPage({ params }: Props) {
  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">지원자 상세</h1>
      <p className="text-gray-400 text-sm">지원 ID: {params.applicationId}</p>
      <p className="text-gray-500 mt-2">구현 예정</p>
    </main>
  )
}
