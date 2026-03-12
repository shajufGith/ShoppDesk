'use client'

import { useEffect, useState } from 'react'

interface Customer {
    id: string; customerNumber: string; name: string
    address1: string; address2?: string; mobile: string; isActive: boolean
    segment?: { id: string; name: string }
}
interface Segment { id: string; name: string }

const EMPTY = { name: '', address1: '', address2: '', mobile: '', segmentId: '', customerNumber: '' }

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [segments, setSegments] = useState<Segment[]>([])
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<Customer | null>(null)
    const [form, setForm] = useState({ ...EMPTY })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')
    const [idMode, setIdMode] = useState<'AUTO' | 'MANUAL'>('AUTO')

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

    function load() {
        const q = search ? `?search=${encodeURIComponent(search)}` : ''
        fetch(`/api/customers${q}`).then(r => r.json()).then(setCustomers)
    }

    useEffect(() => {
        fetch('/api/segments').then(r => r.json()).then(setSegments)
        fetch('/api/settings').then(r => r.json()).then((s: any) => { if (s?.customerIdMode) setIdMode(s.customerIdMode) })
    }, [])

    useEffect(() => { load() }, [search])

    function openCreate() { setEditing(null); setForm({ ...EMPTY }); setError(''); setModal(true) }
    function openEdit(c: Customer) {
        setEditing(c)
        setForm({ name: c.name, address1: c.address1, address2: c.address2 ?? '', mobile: c.mobile, segmentId: c.segment?.id ?? '', customerNumber: c.customerNumber })
        setError(''); setModal(true)
    }

    async function handleSave() {
        setError(''); setSaving(true)
        try {
            const url = editing ? `/api/customers/${editing.id}` : '/api/customers'
            const method = editing ? 'PATCH' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
            const data = await res.json()
            if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return }
            setModal(false); load(); showToast(editing ? 'Customer updated' : 'Customer created')
        } finally { setSaving(false) }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Deactivate ${name}?`)) return
        await fetch(`/api/customers/${id}`, { method: 'DELETE' })
        load(); showToast('Customer deactivated')
    }

    return (
        <div className="page-content">
            <div className="flex items-center justify-between mb-2">
                <h2>Customers</h2>
                <button id="add-customer-btn" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add</button>
            </div>

            <div className="search-wrap mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input id="customer-search" className="search-input" placeholder="Search by name, number, mobile…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {customers.length === 0 ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    <p>No customers found</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {customers.map(c => (
                        <div key={c.id} className="card">
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</span>
                                    <span className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>{c.customerNumber}</span>
                                </div>
                                <div className="flex gap-1">
                                    <a href={`/transactions?customerId=${c.id}&name=${encodeURIComponent(c.name)}`} className="btn btn-ghost btn-sm">Ledger</a>
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>✕</button>
                                </div>
                            </div>
                            <div className="text-muted text-sm">{c.address1}{c.address2 ? `, ${c.address2}` : ''}</div>
                            <div className="text-sm" style={{ marginTop: '0.25rem' }}>📞 {c.mobile}{c.segment && <span className="badge badge-yellow" style={{ marginLeft: '0.5rem' }}>{c.segment.name}</span>}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <span className="modal-title">{editing ? 'Edit Customer' : 'Add Customer'}</span>
                            <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {!editing && (
                                <div className="form-group">
                                    <label className="form-label">Customer ID</label>
                                    <input
                                        className="form-input"
                                        placeholder={idMode === 'AUTO' ? 'Auto-generated' : 'Enter Customer ID'}
                                        value={form.customerNumber}
                                        readOnly={idMode === 'AUTO'}
                                        onChange={e => setForm(f => ({ ...f, customerNumber: e.target.value }))}
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-input" placeholder="Customer Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mobile *</label>
                                <input className="form-input" type="tel" placeholder="Mobile Number" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address 1 *</label>
                                <input className="form-input" placeholder="Street / Area" value={form.address1} onChange={e => setForm(f => ({ ...f, address1: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address 2</label>
                                <input className="form-input" placeholder="City / Landmark" value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Segment</label>
                                <select className="form-select" value={form.segmentId} onChange={e => setForm(f => ({ ...f, segmentId: e.target.value }))}>
                                    <option value="">-- None --</option>
                                    {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            {error && <p className="form-error">{error}</p>}
                            <button id="save-customer-btn" className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                                {saving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : (editing ? 'Update' : 'Add Customer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast toast-success">{toast}</div>}
        </div>
    )
}
