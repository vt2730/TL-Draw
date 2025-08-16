// src/app/(dashboard)/whiteboards/page.tsx
import { Suspense } from 'react'
import { getUserWhiteboards } from '@/lib/actions/whiteboard'
import { WhiteboardList } from '@/components/whiteboard/whiteboard-list'
import { CreateWhiteboardDialog } from '@/components/whiteboard/create-whiteboard-dialog'
import { WhiteboardFilters } from '@/components/whiteboard/whiteboard-filters'

interface SearchParams {
    status?: 'DRAFT' | 'PUBLISHED'
}

export default async function WhiteboardsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const result = await getUserWhiteboards(params.status)

    if (!result.success) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
                    <p className="text-gray-600">{result.error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Whiteboards</h1>
                    <p className="text-gray-600 mt-2">
                        Create and manage your whiteboards
                    </p>
                </div>
                <CreateWhiteboardDialog />
            </div>

            <div className="mb-6">
                <WhiteboardFilters currentStatus={params.status} />
            </div>

            <Suspense fallback={<WhiteboardListSkeleton />}>
                <WhiteboardList whiteboards={result.data ?? []} />
            </Suspense>
        </div>
    )
}

function WhiteboardListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
            ))}
        </div>
    )
}