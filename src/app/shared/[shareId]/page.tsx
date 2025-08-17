// src/app/shared/[shareId]/page.tsx
import { notFound } from 'next/navigation'
import { getSharedWhiteboard } from '@/lib/actions/sharing'
import { SharedWhiteboardViewer } from '@/components/whiteboard/shared-whiteboard-viewer'

interface SharedWhiteboardPageProps {
    params: Promise<{ shareId: string }>
}

export default async function SharedWhiteboardPage({
    params,
}: SharedWhiteboardPageProps) {
    const { shareId } = await params
    const result = await getSharedWhiteboard(shareId)

    if (!result.success || !result.data) {
        notFound()
    }

    return (
        <div className="h-screen flex flex-col">
            <SharedWhiteboardViewer whiteboard={result.data} />
        </div>
    )
}

export async function generateMetadata({
    params,
}: SharedWhiteboardPageProps) {
    const { shareId } = await params
    const result = await getSharedWhiteboard(shareId)

    if (!result.success || !result.data) {
        return {
            title: 'Whiteboard Not Found',
        }
    }

    return {
        title: `${result.data.name} - Shared Whiteboard`,
        description: `View ${result.data.name} - a shared whiteboard`,
    }
}