'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Stats {
    totalCustomers: number
    totalSales: number
    totalCollection: number
    totalDue: number
    todaySales: number
    todayCollection: number
}

export default function DashboardPage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<Stats | null>(null)
    const isManager = session?.user?.role === 'MANAGER'

    useEffect(() => {
        fetch('/api/dashboard/stats').then(r => r.json()).then(setStats)
    }, [])

    return (
        <div className="page-content">
            {/* Welcome */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>
                    Hello, {session?.user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-muted text-sm">Here&apos;s your shop overview</p>
            </div>

            {/* Stats Grid */}
            {stats ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-label">Customers</div>
                            <div className="stat-value">{stats.totalCustomers}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-label">Amount Due</div>
                            <div className="stat-value" style={{ fontSize: '1.3rem', color: '#dc2626' }}>
                                ₹{Number(stats.totalDue).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    <p className="section-title">Today</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="stat-card">
                            <div className="stat-icon">📦</div>
                            <div className="stat-label">Sales</div>
                            <div className="stat-value amount-debit" style={{ fontSize: '1.3rem' }}>
                                ₹{Number(stats.todaySales).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-label">Collection</div>
                            <div className="stat-value amount-credit" style={{ fontSize: '1.3rem' }}>
                                ₹{Number(stats.todayCollection).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    <p className="section-title">All Time</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="stat-card">
                            <div className="stat-icon">📈</div>
                            <div className="stat-label">Total Sales</div>
                            <div className="stat-value amount-debit" style={{ fontSize: '1.3rem' }}>
                                ₹{Number(stats.totalSales).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">💳</div>
                            <div className="stat-label">Total Collected</div>
                            <div className="stat-value amount-credit" style={{ fontSize: '1.3rem' }}>
                                ₹{Number(stats.totalCollection).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="loading-center"><span className="spinner" /></div>
            )}

            {/* Quick Actions */}
            <p className="section-title" style={{ marginTop: '1.5rem' }}>Quick Actions</p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                <a href="/transactions?tab=SALES" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.5rem' }}>📦</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>New Sale Entry</div>
                        <div className="text-muted text-sm">Add a credit sale for a customer</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
                </a>
                <a href="/transactions?tab=COLLECTION" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.5rem' }}>💳</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>Record Collection</div>
                        <div className="text-muted text-sm">Enter payment received from customer</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
                </a>
                <a href="/customers" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.5rem' }}>👥</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>Manage Customers</div>
                        <div className="text-muted text-sm">View or add new customers</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
                </a>
            </div>
        </div>
    )
}
