'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterBusinessPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        businessName: '',
        address: '',
        adminName: '',
        username: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/register-business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Registration failed')
                console.error('Registration server error:', data.error)
            } else {
                router.push('/login?registered=true')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.brand}>
                <div style={styles.logo}>🏪</div>
                <h1 style={styles.appName}>ShopDesk</h1>
                <p style={styles.tagline}>Register Your Business</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <h2 style={styles.formTitle}>Business Details</h2>

                <div className="form-group">
                    <label className="form-label">Business Name *</label>
                    <input className="form-input" required value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. My Awesome Shop" />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Address</label>
                    <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Business location" />
                </div>

                <h2 style={{ ...styles.formTitle, marginTop: '2rem', fontSize: '1.2rem' }}>Admin Account</h2>

                <div className="form-grid form-grid-2">
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input className="form-input" required value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Username *</label>
                        <input className="form-input" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="admin" />
                    </div>
                </div>

                <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input className="form-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password *</label>
                        <input className="form-input" type="password" required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" />
                    </div>
                </div>

                {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}

                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '2rem' }} disabled={loading}>
                    {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Register & Setup'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Already have an account? <a href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
                    </p>
                </div>
            </form>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    },
    brand: { textAlign: 'center', marginBottom: '1.5rem' },
    logo: { fontSize: '3rem', marginBottom: '0.25rem' },
    appName: { fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 700, color: 'var(--brand-primary)' },
    tagline: { color: 'var(--text-muted)', fontSize: '0.9rem' },
    card: {
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        boxShadow: 'var(--shadow-lg)',
    },
    formTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' },
}
