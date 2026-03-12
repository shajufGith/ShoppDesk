'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Customer { id: string; customerNumber: string; name: string }
interface TxnRow { id: string; type: string; amount: string; date: string; note: string; customer: { customerNumber: string; name: string }; createdBy: { name: string } }

type TxType = 'SALES' | 'COLLECTION' | 'OPENING'

function TransactionsInner() {
    const searchParams = useSearchParams()
    const preCustomerId = searchParams.get('customerId') ?? ''
    const preCustomerName = searchParams.get('name') ?? ''
    const preTab = searchParams.get('tab') as TxType | null

    const [tab, setTab] = useState<TxType>(preTab || 'SALES')
    const [customers, setCustomers] = useState<Customer[]>([])
    const [txns, setTxns] = useState<TxnRow[]>([])
    const [modal, setModal] = useState(false)
    const [editTxn, setEditTxn] = useState<TxnRow | null>(null)
    const [form, setForm] = useState({ customerId: preCustomerId, amount: '', date: new Date().toISOString().split('T')[0], note: '' })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')
    const [filterCust, setFilterCust] = useState(preCustomerId)

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

    useEffect(() => { fetch('/api/customers').then(r => r.json()).then(setCustomers) }, [])

    const loadTxns = useCallback(() => {
        const params = new URLSearchParams({ type: tab })
        if (filterCust) params.set('customerId', filterCust)
        fetch(`/api/transactions?${params}`).then(r => r.json()).then(setTxns)
    }, [tab, filterCust])
    useEffect(() => { loadTxns() }, [loadTxns])

    function openCreate() { setEditTxn(null); setForm({ customerId: filterCust || preCustomerId, amount: '', date: new Date().toISOString().split('T')[0], note: '' }); setError(''); setModal(true) }
    function openEdit(t: TxnRow) { setEditTxn(t); setForm({ customerId: t.customer.customerNumber, amount: String(t.amount), date: t.date.split('T')[0], note: t.note ?? '' }); setError(''); setModal(true) }

    async function handleSave() {
        setError(''); setSaving(true)
        try {
            if (editTxn) {
                const res = await fetch(`/api/transactions/${editTxn.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: form.amount, date: form.date, note: form.note }) })
                if (!res.ok) { const d = await res.json(); setError(d.error); return }
            } else {
                const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, type: tab }) })
                if (!res.ok) { const d = await res.json(); setError(d.error); return }
            }
            setModal(false); loadTxns(); showToast(editTxn ? 'Updated' : 'Entry saved')
        } finally { setSaving(false) }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this entry?')) return
        await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
        loadTxns(); showToast('Deleted')
    }

    const label = { SALES: 'Sales (Debit)', COLLECTION: 'Collection (Credit)', OPENING: 'Opening Balance' }
    const total = txns.reduce((s, t) => s + Number(t.amount), 0)

    return (
        <div className="page-content">
            {preCustomerName && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>Ledger: {preCustomerName}</h2>
                </div>
            )}

            {/* Tabs */}
            <div className="filter-tabs">
                {(['SALES', 'COLLECTION', 'OPENING'] as TxType[]).map(t => (
                    <button key={t} id={`tab-${t.toLowerCase()}`} className={`filter-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                        {t === 'OPENING' ? 'Opening' : t === 'SALES' ? '📦 Sales' : '💳 Collection'}
                    </button>
                ))}
            </div>

            {/* Customer filter */}
            {!preCustomerId && (
                <div className="form-group mb-2">
                    <select className="form-select" value={filterCust} onChange={e => setFilterCust(e.target.value)}>
                        <option value="">All Customers</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.customerNumber} – {c.name}</option>)}
                    </select>
                </div>
            )}

            {/* List header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-muted text-sm">{txns.length} entries · Total: <strong className={tab === 'COLLECTION' ? 'amount-credit' : 'amount-debit'}>₹{total.toLocaleString('en-IN')}</strong></span>
                <button id="add-txn-btn" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add</button>
            </div>

            {txns.length === 0 ? (
                <div className="empty-state"><p>No {label[tab]} entries yet</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {txns.map(t => (
                        <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600 }}>{t.customer.name} <span className="text-muted text-xs">#{t.customer.customerNumber}</span></div>
                                <div className="text-muted text-xs">{new Date(t.date).toLocaleDateString('en-IN')} · {t.createdBy.name}{t.note && ` · ${t.note}`}</div>
                            </div>
                            <div className={tab === 'COLLECTION' ? 'amount-credit' : 'amount-debit'} style={{ flexShrink: 0, fontSize: '1.05rem' }}>
                                ₹{Number(t.amount).toLocaleString('en-IN')}
                            </div>
                            <div className="flex gap-1" style={{ flexShrink: 0 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>✎</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <span className="modal-title">{editTxn ? 'Edit Entry' : `New ${label[tab]}`}</span>
                            <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {!editTxn && (
                                <div className="form-group">
                                    <label className="form-label">Customer *</label>
                                    <select className="form-select" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.customerNumber} – {c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Note</label>
                                <input className="form-input" placeholder="Optional note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                            </div>
                            {error && <p className="form-error">{error}</p>}
                            <button id="save-txn-btn" className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                                {saving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast toast-success">{toast}</div>}
        </div>
    )
}

export default function TransactionsPage() {
    return <Suspense fallback={<div className="loading-center"><span className="spinner" /></div>}><TransactionsInner /></Suspense>
}
