'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const res = await signIn('credentials', {
            username,
            password,
            redirect: false,
        })

        setLoading(false)

        if (res?.error) {
            setError('Invalid username or password')
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div style={styles.page}>
            {/* Brand */}
            <div style={styles.brand}>
                <div style={styles.logo}>🏪</div>
                <h1 style={styles.appName}>ShopDesk</h1>
                <p style={styles.tagline}>Credit Sales Management</p>
            </div>

            {/* Login Card */}
            <form onSubmit={handleSubmit} style={styles.card}>
                <h2 style={styles.formTitle}>Sign In</h2>

                <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                        id="username"
                        className="form-input"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Password</label>
                    <input
                        id="password"
                        className="form-input"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                {error && <p className="form-error" style={{ marginTop: '0.75rem' }}>{error}</p>}

                <button
                    id="login-btn"
                    type="submit"
                    className="btn btn-primary btn-full"
                    style={{ marginTop: '1.5rem' }}
                    disabled={loading}
                >
                    {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Sign In'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        New to ShopDesk? <a href="/register-business" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Register Business</a>
                    </p>
                </div>
            </form>

            <p style={styles.footer}>ShopDesk v1.0</p>
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
    brand: {
        textAlign: 'center',
        marginBottom: '2rem',
    },
    logo: {
        fontSize: '3.5rem',
        marginBottom: '0.5rem',
    },
    appName: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '2.2rem',
        fontWeight: 700,
        color: 'var(--brand-primary)',
        marginBottom: '0.25rem',
    },
    tagline: {
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        fontWeight: 500,
    },
    card: {
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '2.25rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)',
    },
    formTitle: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '1.4rem',
        fontWeight: 700,
        marginBottom: '1.75rem',
        color: 'var(--text-primary)',
    },
    footer: {
        marginTop: '2rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
    },
}
