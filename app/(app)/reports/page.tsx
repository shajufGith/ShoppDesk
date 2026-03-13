'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Customer { id: string; customerNumber: string; name: string }
interface Segment { id: string; name: string }
interface Area { id: string; name: string }

type ReportType = 'statement' | 'sales' | 'collection' | 'due'
type DateFilter = 'all' | '30days' | 'today' | 'custom'

function getDateRange(filter: DateFilter): { from?: string; to?: string } {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (filter === 'today') return { from: today, to: today }
    if (filter === '30days') {
        const d = new Date(now); d.setDate(d.getDate() - 30)
        return { from: d.toISOString().split('T')[0], to: today }
    }
    return {}
}

function ReportsInner() {
    const { data: session } = useSession()
    const [type, setType] = useState<ReportType>('statement')
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')
    const [customers, setCustomers] = useState<Customer[]>([])
    const [segments, setSegments] = useState<Segment[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [custId, setCustId] = useState('')
    const [segId, setSegId] = useState('')
    const [areaId, setAreaId] = useState('')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetch('/api/customers').then(r => r.json()).then(setCustomers)
        fetch('/api/segments').then(r => r.json()).then(setSegments)
        fetch('/api/areas').then(r => r.json()).then(setAreas)
    }, [])

    async function runReport() {
        setLoading(true); setData(null)
        const dateRange = dateFilter === 'custom' ? { from: customFrom, to: customTo } : getDateRange(dateFilter)
        const params = new URLSearchParams({
            type,
            ...(dateRange.from ? { from: dateRange.from } : {}),
            ...(dateRange.to ? { to: dateRange.to } : {}),
            ...(custId ? { customerId: custId } : {}),
            ...(segId ? { segmentId: segId } : {}),
            ...(areaId ? { areaId: areaId } : {})
        })
        const res = await fetch(`/api/reports?${params}`)
        const json = await res.json()
        setData(json); setLoading(false)
    }

    function downloadPDF() {
        if (!data) return
        const doc = new jsPDF()
        const businessName = session?.user?.businessName || 'ShopDesk'
        doc.setFontSize(16)
        doc.text(businessName, 14, 15)
        doc.setFontSize(10)
        doc.text(`${type.toUpperCase()} REPORT`, 14, 22)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27)

        if (type === 'statement' && Array.isArray(data)) {
            data.forEach((c: any, idx: number) => {
                if (idx > 0) doc.addPage()
                doc.setFontSize(14)
                doc.text(`Customer: ${c.customer.name} (#${c.customer.customerNumber})`, 14, 30)
                doc.setFontSize(10)
                doc.text(`Segment: ${c.customer.segment ?? '—'} | Area: ${c.customer.area ?? '—'}`, 14, 36)
                doc.text(`Closing Balance: ${fmt(c.closingBalance)}`, 14, 42)

                autoTable(doc, {
                    startY: 48,
                    head: [['Date', 'Type', 'Debit', 'Credit', 'Balance', 'Note']],
                    body: c.rows.map((r: any) => [
                        fmtDate(r.date),
                        r.type,
                        r.debit != null ? fmt(r.debit) : '—',
                        r.credit != null ? fmt(r.credit) : '—',
                        fmt(r.balance),
                        r.note ?? ''
                    ]),
                })
            })
        } else if (type === 'sales' || type === 'collection') {
            doc.text(`Total ${type === 'sales' ? 'Sales' : 'Collection'}: ${fmt(data.total)}`, 14, 30)
            autoTable(doc, {
                startY: 38,
                head: [['Date', 'Customer', 'Segment', 'Area', 'Amount', 'Note']],
                body: data.rows.map((r: any) => [
                    fmtDate(r.date),
                    r.customer.name,
                    r.customer.segment?.name ?? '—',
                    r.customer.area?.name ?? '—',
                    fmt(Number(r.amount)),
                    r.note ?? ''
                ]),
            })
        } else if (type === 'due') {
            doc.text(`Total Amount Due: ${fmt(data.totalDue)}`, 14, 30)
            autoTable(doc, {
                startY: 38,
                head: [['#', 'Customer', 'Segment', 'Area', 'Amount Due']],
                body: data.rows.map((r: any) => [
                    r.customerNumber,
                    r.name,
                    r.segment ?? '—',
                    r.area ?? '—',
                    fmt(r.due)
                ]),
            })
        }

        doc.save(`${type}-report.pdf`)
    }

    const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN')

    return (
        <div className="page-content">
            <h2 style={{ marginBottom: '1rem' }}>Reports</h2>

            {/* Report Type */}
            <p className="form-label" style={{ marginBottom: '0.4rem' }}>Report Type</p>
            <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
                {([['statement', 'Statement'], ['sales', 'Sales'], ['collection', 'Collection'], ['due', 'Amount Due']] as [ReportType, string][]).map(([v, l]) => (
                    <button key={v} id={`report-type-${v}`} className={`filter-tab ${type === v ? 'active' : ''}`} onClick={() => { setType(v); setData(null) }}>{l}</button>
                ))}
            </div>

            {/* Date Filter (not for due) */}
            {type !== 'due' && (
                <>
                    <p className="form-label" style={{ marginBottom: '0.4rem' }}>Period</p>
                    <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
                        {([['all', 'All Time'], ['today', 'Today'], ['30days', 'Last 30 Days'], ['custom', 'Custom']] as [DateFilter, string][]).map(([v, l]) => (
                            <button key={v} className={`filter-tab ${dateFilter === v ? 'active' : ''}`} onClick={() => setDateFilter(v)}>{l}</button>
                        ))}
                    </div>
                    {dateFilter === 'custom' && (
                        <div className="form-grid form-grid-2" style={{ marginBottom: '1rem' }}>
                            <div className="form-group"><label className="form-label">From</label><input className="form-input" type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">To</label><input className="form-input" type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} /></div>
                        </div>
                    )}
                </>
            )}

            {/* Filters */}
            <div className="form-grid form-grid-3" style={{ marginBottom: '1rem' }}>
                {type === 'statement' && (
                    <div className="form-group">
                        <label className="form-label">Customer</label>
                        <select className="form-select" value={custId} onChange={e => { setCustId(e.target.value); setSegId(''); setAreaId('') }}>
                            <option value="">All</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.customerNumber} – {c.name}</option>)}
                        </select>
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">Segment</label>
                    <select className="form-select" value={segId} onChange={e => setSegId(e.target.value)} disabled={!!custId}>
                        <option value="">All Segments</option>
                        {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Area</label>
                    <select className="form-select" value={areaId} onChange={e => setAreaId(e.target.value)} disabled={!!custId}>
                        <option value="">All Areas</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex gap-1 mb-2">
                <button id="run-report-btn" className="btn btn-primary" style={{ flex: 1 }} onClick={runReport} disabled={loading}>
                    {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Generating…</> : '📊 Generate Report'}
                </button>
                {data && (
                    <button className="btn btn-secondary" onClick={downloadPDF}>
                        📄 PDF
                    </button>
                )}
            </div>

            {/* ── Statement Report ── */}
            {data && type === 'statement' && Array.isArray(data) && (
                data.length === 0 ? <div className="empty-state"><p>No data</p></div> :
                    data.map((c: any) => (
                        <div key={c.customer.id} className="card" style={{ marginBottom: '1rem' }}>
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <span style={{ fontWeight: 700 }}>{c.customer.name}</span>
                                    <span className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>{c.customer.customerNumber}</span>
                                    {c.customer.segment && <span className="badge badge-yellow" style={{ marginLeft: '0.4rem' }}>{c.customer.segment}</span>}
                                    {c.customer.area && <span className="badge" style={{ marginLeft: '0.4rem', background: '#e0f2fe', color: '#0369a1' }}>📍 {c.customer.area}</span>}
                                </div>
                                <span className={`font-bold ${c.closingBalance > 0 ? 'amount-debit' : 'amount-credit'}`}>{fmt(c.closingBalance)}</span>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Date</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th><th>Note</th></tr></thead>
                                    <tbody>
                                        {c.rows.map((r: any, i: number) => (
                                            <tr key={i}>
                                                <td>{fmtDate(r.date)}</td>
                                                <td><span className={`badge ${r.type === 'COLLECTION' ? 'badge-green' : r.type === 'OPENING' ? 'badge-blue' : 'badge-red'}`}>{r.type}</span></td>
                                                <td className="amount-debit">{r.debit != null ? fmt(r.debit) : '—'}</td>
                                                <td className="amount-credit">{r.credit != null ? fmt(r.credit) : '—'}</td>
                                                <td className="amount-balance">{fmt(r.balance)}</td>
                                                <td className="text-muted text-xs">{r.note ?? ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
            )}

            {/* ── Sales / Collection Report ── */}
            {data && (type === 'sales' || type === 'collection') && (
                <>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-muted">Total {type === 'sales' ? 'Sales' : 'Collection'}</span>
                            <span className={`font-bold ${type === 'sales' ? 'amount-debit' : 'amount-credit'}`} style={{ fontSize: '1.3rem' }}>{fmt(data.total)}</span>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Date</th><th>Customer</th><th>Area</th><th>Amount</th><th>Note</th><th>By</th></tr></thead>
                            <tbody>
                                {data.rows.map((r: any) => (
                                    <tr key={r.id}>
                                        <td>{fmtDate(r.date)}</td>
                                        <td>{r.customer.name} <span className="text-muted text-xs">#{r.customer.customerNumber}</span></td>
                                        <td>{r.customer.area?.name ?? '—'}</td>
                                        <td className={type === 'sales' ? 'amount-debit' : 'amount-credit'}>{fmt(Number(r.amount))}</td>
                                        <td className="text-muted text-xs">{r.note ?? ''}</td>
                                        <td className="text-muted text-xs">{r.createdBy.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── Amount Due Report ── */}
            {data && type === 'due' && (
                <>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-muted">Total Amount Due</span>
                            <span className="amount-debit font-bold" style={{ fontSize: '1.3rem' }}>{fmt(data.totalDue)}</span>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>Customer</th><th>Area</th><th>Amount Due</th></tr></thead>
                            <tbody>
                                {data.rows.map((r: any) => (
                                    <tr key={r.id}>
                                        <td className="text-muted text-xs">{r.customerNumber}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{r.name}</div>
                                            {r.mobile && (
                                                <a href={`tel:${r.mobile}`} className="text-xs" style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>
                                                    📞 {r.mobile}
                                                </a>
                                            )}
                                        </td>
                                        <td>{r.area ?? '—'}</td>
                                        <td className="amount-debit font-bold">{fmt(r.due)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}

export default function ReportsPage() {
    return <Suspense fallback={<div className="loading-center"><span className="spinner" /></div>}><ReportsInner /></Suspense>
}
