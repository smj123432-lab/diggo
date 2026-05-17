export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default function ChatRoomPage({ params }: Props) {
  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">채팅방</h1>
      <p className="text-gray-400 text-sm">채팅방 ID: {params.id}</p>
      <p className="text-gray-500 mt-2">구현 예정 (v2)</p>
    </main>
  )
}
