// src/components/whiteboard/whiteboard-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface WhiteboardFiltersProps {
    currentStatus?: 'DRAFT' | 'PUBLISHED'
}

export function WhiteboardFilters({ currentStatus }: WhiteboardFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateFilter = (status: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (status) {
            params.set('status', status)
        } else {
            params.delete('status')
        }
        router.push(`/whiteboards?${params.toString()}`)
    }

    return (
        <div className="flex space-x-2">
            <button
                onClick={() => updateFilter(null)}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${!currentStatus
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                All
            </button>
            <button
                onClick={() => updateFilter('DRAFT')}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentStatus === 'DRAFT'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                Draft
            </button>
            <button
                onClick={() => updateFilter('PUBLISHED')}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentStatus === 'PUBLISHED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                Published
            </button>
        </div>
    )
}