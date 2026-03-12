'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Employee {
    id: string; name: string; username: string
    role: string; designation: string; isActive: boolean
}

const EMPTY: Omit<Employee, 'id' | 'isActive'> & { password: string } = {
    name: '', username: '', role: 'EMPLOYEE', designation: '', password: ''
}

export default function EmployeesPage() {
    const { data: session } = useSession()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<Employee | null>(null)
    const [form, setForm] = useState({ ...EMPTY })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

    const load = () => fetch('/api/employees').then(r => r.json()).then(setEmployees)
    useEffect(() => { load() }, [])

    function openCreate() { setEditing(null); setForm({ ...EMPTY }); setError(''); setModal(true) }
    function openEdit(e: Employee) { setEditing(e); setForm({ name: e.name, username: e.username, role: e.role, designation: e.designation ?? '', password: '' }); setError(''); setModal(true) }

    async function handleSave() {
        setError(''); setSaving(true)
        try {
            const url = editing ? `/api/employees/${editing.id}` : '/api/employees'
            const method = editing ? 'PATCH' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
            const data = await res.json()
            if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return }
            setModal(false); load(); showToast(editing ? 'Employee updated' : 'Employee created')
        } finally { setSaving(false) }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Deactivate ${name}?`)) return
        const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
        if (res.ok) { load(); showToast('Employee deactivated') }
    }

    return (
        <div className="page-content">
            <div className="flex items-center justify-between mb-2">
                <h2>Staff Management</h2>
                <button id="add-employee-btn" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add</button>
            </div>

            {employees.length === 0 ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    <p>No staff members yet</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {employees.map(emp => (
                        <div key={emp.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                {emp.name[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{emp.name}</div>
                                <div className="text-muted text-xs">@{emp.username} · {emp.designation || emp.role}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                                <span className={`badge ${emp.role === 'MANAGER' ? 'badge-purple' : 'badge-blue'}`}>{emp.role}</span>
                                <span className={`badge ${emp.isActive ? 'badge-green' : 'badge-red'}`}>{emp.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id, emp.name)}>✕</button>
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
                            <span className="modal-title">{editing ? 'Edit Employee' : 'Add Employee'}</span>
                            <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-input" placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Username *</label>
                                <input className="form-input" placeholder="Username (for login)" value={form.username} readOnly={!!editing} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                                <input className="form-input" type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                            </div>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="MANAGER">Manager</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input className="form-input" placeholder="e.g. Salesman" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
                                </div>
                            </div>
                            {error && <p className="form-error">{error}</p>}
                            <button id="save-employee-btn" className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                                {saving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : (editing ? 'Update' : 'Create Employee')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast toast-success">{toast}</div>}
        </div>
    )
}
