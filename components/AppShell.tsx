'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const NAV_EMPLOYEE = [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/customers', label: 'Customers', icon: UsersIcon },
    { href: '/transactions', label: 'Ledger', icon: LedgerIcon },
    { href: '/reports', label: 'Reports', icon: ChartIcon },
]

const NAV_MANAGER = [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/customers', label: 'Customers', icon: UsersIcon },
    { href: '/employees', label: 'Staff', icon: TeamIcon },
    { href: '/reports', label: 'Reports', icon: ChartIcon },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()

    const isManager = session?.user?.role === 'MANAGER'
    const navItems = isManager ? NAV_MANAGER : NAV_EMPLOYEE

    // Find active page title
    const activeItem = navItems.find((n) => pathname.startsWith(n.href))
    const pageTitle = activeItem?.label ?? 'ShopDesk'

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Header */}
            <header className="top-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>🏪</span>
                    <span className="header-title">{pageTitle}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {session?.user?.name}
                    </span>
                    <span className={`badge ${isManager ? 'badge-purple' : 'badge-blue'}`}>
                        {isManager ? 'Manager' : 'Employee'}
                    </span>
                </div>
            </header>

            {/* Page Content */}
            <main style={{ flex: 1 }}>
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = pathname.startsWith(item.href)
                    return (
                        <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                            <Icon />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    )
}
function UsersIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
function LedgerIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="7" y1="8" x2="17" y2="8" />
            <line x1="7" y1="12" x2="13" y2="12" />
        </svg>
    )
}
function ChartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    )
}
function TeamIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" />
            <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
    )
}
function SettingsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
}
