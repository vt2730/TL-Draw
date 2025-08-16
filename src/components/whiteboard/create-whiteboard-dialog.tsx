// src/components/whiteboard/create-whiteboard-dialog.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWhiteboard } from '@/lib/actions/whiteboard'
import { WhiteboardStatus } from '@/types/whiteboard'

export function CreateWhiteboardDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState('')
    const [status, setStatus] = useState<WhiteboardStatus>('DRAFT')
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        startTransition(async () => {
            const result = await createWhiteboard({
                name: name.trim(),
                status,
            })

            if (result.success && result.data) {
                setIsOpen(false)
                setName('')
                setStatus('DRAFT')
                router.push(`/whiteboards/${result.data.id}`)
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 cursor-pointer rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
                Create Whiteboard
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Create New Whiteboard</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter whiteboard name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="DRAFT"
                                            checked={status === 'DRAFT'}
                                            onChange={(e) => setStatus(e.target.value as WhiteboardStatus)}
                                            className="mr-2"
                                            disabled={isPending}
                                        />
                                        Draft
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="PUBLISHED"
                                            checked={status === 'PUBLISHED'}
                                            onChange={(e) => setStatus(e.target.value as WhiteboardStatus)}
                                            className="mr-2"
                                            disabled={isPending}
                                        />
                                        Published
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    disabled={isPending}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || !name.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? 'Creating...' : 'Create & Open'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}