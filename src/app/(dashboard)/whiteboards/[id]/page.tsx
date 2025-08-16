// src/app/(dashboard)/whiteboards/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getWhiteboardById } from '@/lib/actions/whiteboard'
import { WhiteboardEditor } from '@/components/whiteboard/whiteboard-editor'

interface WhiteboardEditorPageProps {
  params: Promise<{ id: string }>
}

export default async function WhiteboardEditorPage({
  params,
}: WhiteboardEditorPageProps) {
  const { id } = await params
  const result = await getWhiteboardById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="h-screen flex flex-col">
      <WhiteboardEditor whiteboard={result.data} />
    </div>
  )
}

export async function generateMetadata({
  params,
}: WhiteboardEditorPageProps) {
  const { id } = await params
  const result = await getWhiteboardById(id)

  if (!result.success || !result.data) {
    return {
      title: 'Whiteboard Not Found',
    }
  }

  return {
    title: `${result.data.name} | Whiteboard Editor`,
    description: `Edit your whiteboard: ${result.data.name}`,
  }
}