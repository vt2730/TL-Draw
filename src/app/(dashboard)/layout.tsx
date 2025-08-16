// src/app/(dashboard)/layout.tsx
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main>{children}</main>
        </div>
    )
}