'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'

interface Settings { customerIdMode: 'AUTO' | 'MANUAL'; customerPrefix: string }
interface Segment { id: string; name: string }
interface Area { id: string; name: string }

export default function SettingsPage() {
    const { data: session } = useSession()
    const isManager = session?.user?.role === 'MANAGER'

    const [settings, setSettings] = useState<Settings>({ customerIdMode: 'AUTO', customerPrefix: 'CUST' })
    const [segments, setSegments] = useState<Segment[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [newSeg, setNewSeg] = useState('')
    const [newArea, setNewArea] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

    useEffect(() => {
        if (isManager) {
            fetch('/api/settings')
                .then(r => r.ok ? r.json() : null)
                .then(data => data && setSettings(data))
                .catch(() => { })

            fetch('/api/segments')
                .then(r => r.ok ? r.json() : [])
                .then(data => Array.isArray(data) && setSegments(data))
                .catch(() => { })

            fetch('/api/areas')
                .then(r => r.ok ? r.json() : [])
                .then(data => Array.isArray(data) && setAreas(data))
                .catch(() => { })
        }
    }, [isManager])

    async function saveSettings() {
        setSaving(true)
        const res = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
        setSaving(false)
        if (res.ok) showToast('Settings saved')
    }

    async function addSegment() {
        if (!newSeg.trim()) return
        const res = await fetch('/api/segments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSeg.trim() }) })
        if (res.ok) { setNewSeg(''); fetch('/api/segments').then(r => r.json()).then(setSegments); showToast('Segment added') }
        else { const d = await res.json(); showToast(d.error) }
    }

    async function deleteSegment(id: string, name: string) {
        if (!confirm(`Delete segment "${name}"?`)) return
        const res = await fetch(`/api/segments/${id}`, { method: 'DELETE' })
        if (res.ok) { fetch('/api/segments').then(r => r.json()).then(setSegments); showToast('Deleted') }
        else { const d = await res.json(); showToast(d.error) }
    }

    async function addArea() {
        if (!newArea.trim()) return
        const res = await fetch('/api/areas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newArea.trim() }) })
        if (res.ok) { setNewArea(''); fetch('/api/areas').then(r => r.json()).then(setAreas); showToast('Area added') }
        else { const d = await res.json(); showToast(d.error) }
    }

    async function deleteArea(id: string, name: string) {
        if (!confirm(`Delete area "${name}"?`)) return
        const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' })
        if (res.ok) { fetch('/api/areas').then(r => r.json()).then(setAreas); showToast('Deleted') }
        else { const d = await res.json(); showToast(d.error) }
    }

    return (
        <div className="page-content">
            <h2 style={{ marginBottom: '1.25rem' }}>Settings</h2>

            {/* Profile Card */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <p className="section-title">Account</p>
                <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'white', flexShrink: 0 }}>
                        {session?.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{session?.user?.name}</div>
                        <div className="text-muted text-xs">{session?.user?.designation || session?.user?.role}</div>
                    </div>
                </div>
                <button className="btn btn-danger btn-full" onClick={() => signOut({ callbackUrl: '/login' })}>🚪 Sign Out</button>
            </div>

            {/* Manager-only settings */}
            {isManager && (
                <>
                    {/* Customer ID Mode */}
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <p className="section-title">Customer ID Mode</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {(['AUTO', 'MANUAL'] as const).map(mode => (
                                <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${settings.customerIdMode === mode ? 'var(--brand-primary)' : 'var(--border)'}`, background: settings.customerIdMode === mode ? 'rgba(79,70,229,0.1)' : 'transparent' }}>
                                    <input type="radio" name="idMode" value={mode} checked={settings.customerIdMode === mode} onChange={() => setSettings(s => ({ ...s, customerIdMode: mode }))} style={{ accentColor: 'var(--brand-primary)' }} />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{mode === 'AUTO' ? '⚡ Auto-Generated' : '✏️ Manual Entry'}</div>
                                        <div className="text-muted text-xs">{mode === 'AUTO' ? 'System auto-assigns CUST-0001, CUST-0002…' : 'Employee types in the Customer ID manually'}</div>
                                    </div>
                                </label>
                            ))}
                            {settings.customerIdMode === 'AUTO' && (
                                <div className="form-group">
                                    <label className="form-label">Prefix (e.g. CUST)</label>
                                    <input className="form-input" placeholder="CUST" value={settings.customerPrefix} onChange={e => setSettings(s => ({ ...s, customerPrefix: e.target.value }))} maxLength={10} />
                                </div>
                            )}
                            <button id="save-settings-btn" className="btn btn-primary btn-full" onClick={saveSettings} disabled={saving}>
                                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Settings'}
                            </button>
                        </div>
                    </div>

                    {/* Segments & Areas Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Segments */}
                        <div className="card">
                            <p className="section-title">Customer Segments</p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input id="new-segment-input" className="form-input" placeholder="New segment…" value={newSeg} onChange={e => setNewSeg(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSegment()} style={{ flex: 1 }} />
                                <button id="add-segment-btn" className="btn btn-success" onClick={addSegment}>Add</button>
                            </div>
                            {segments.length === 0 ? (
                                <p className="text-muted text-sm">No segments yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {segments.map(s => (
                                        <div key={s.id} className="flex items-center justify-between" style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
                                            <span style={{ fontWeight: 500 }}>🏷️ {s.name}</span>
                                            <button className="btn btn-danger btn-sm" onClick={() => deleteSegment(s.id, s.name)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Areas */}
                        <div className="card">
                            <p className="section-title">Customer Areas</p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input id="new-area-input" className="form-input" placeholder="New area…" value={newArea} onChange={e => setNewArea(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArea()} style={{ flex: 1 }} />
                                <button id="add-area-btn" className="btn btn-success" onClick={addArea}>Add</button>
                            </div>
                            {areas.length === 0 ? (
                                <p className="text-muted text-sm">No areas yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {areas.map(a => (
                                        <div key={a.id} className="flex items-center justify-between" style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
                                            <span style={{ fontWeight: 500 }}>📍 {a.name}</span>
                                            <button className="btn btn-danger btn-sm" onClick={() => deleteArea(a.id, a.name)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {toast && <div className="toast toast-success">{toast}</div>}
        </div>
    )
}
