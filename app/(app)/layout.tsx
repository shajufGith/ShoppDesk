'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/AppShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <AuthGuard>{children}</AuthGuard>
}

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="loading-center" style={{ minHeight: '100dvh' }}>
                <span className="spinner" style={{ width: 36, height: 36 }} />
            </div>
        )
    }

    if (!session) return null

    return <AppShell>{children}</AppShell>
}
