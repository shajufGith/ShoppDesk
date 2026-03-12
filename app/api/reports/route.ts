import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/reports?type=statement|sales|collection|due&from=&to=&customerId=&segmentId=
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'statement'
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const customerId = searchParams.get('customerId') ?? undefined
    const segmentId = searchParams.get('segmentId') ?? undefined

    const dateFilter = (from || to) ? {
        date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
        },
    } : {}

    // ── Customer Statement ────────────────────────────────────────────────────────
    if (type === 'statement') {
        const customers = await prisma.customer.findMany({
            where: {
                isActive: true,
                ...(customerId ? { id: customerId } : {}),
                ...(segmentId ? { segmentId } : {}),
            },
            include: {
                segment: { select: { name: true } },
                transactions: {
                    where: dateFilter,
                    orderBy: { date: 'asc' },
                    include: { createdBy: { select: { name: true } } },
                },
            },
            orderBy: { name: 'asc' },
        })

        const result = customers.map((c: any) => {
            let balance = 0
            const rows = c.transactions.map((t: any) => {
                const amt = Number(t.amount)
                if (t.type === 'OPENING' || t.type === 'SALES') balance += amt
                else balance -= amt
                return {
                    id: t.id,
                    date: t.date,
                    type: t.type,
                    debit: t.type !== 'COLLECTION' ? amt : null,
                    credit: t.type === 'COLLECTION' ? amt : null,
                    balance,
                    note: t.note,
                    createdBy: t.createdBy.name,
                }
            })
            return { customer: { id: c.id, customerNumber: c.customerNumber, name: c.name, segment: c.segment?.name }, rows, closingBalance: balance }
        })
        return NextResponse.json(result)
    }

    // ── Sales / Collection Totals ─────────────────────────────────────────────────
    if (type === 'sales' || type === 'collection') {
        const txnType = type === 'sales' ? 'SALES' : 'COLLECTION'
        const rows = await prisma.transaction.findMany({
            where: { type: txnType as any, ...dateFilter, ...(customerId ? { customerId } : {}), ...(segmentId ? { customer: { segmentId } } : {}) },
            include: { customer: { select: { customerNumber: true, name: true, segment: { select: { name: true } } } }, createdBy: { select: { name: true } } },
            orderBy: { date: 'asc' },
        })
        const total = rows.reduce((s: number, r: any) => s + Number(r.amount), 0)
        return NextResponse.json({ rows, total })
    }

    // ── Amount Due ────────────────────────────────────────────────────────────────
    if (type === 'due') {
        const customers = await prisma.customer.findMany({
            where: { isActive: true, ...(segmentId ? { segmentId } : {}) },
            include: {
                segment: { select: { name: true } },
                transactions: { select: { type: true, amount: true } },
            },
            orderBy: { name: 'asc' },
        })

        const result = customers.map((c: any) => {
            const due = c.transactions.reduce((sum: number, t: any) => {
                const amt = Number(t.amount)
                return t.type === 'COLLECTION' ? sum - amt : sum + amt
            }, 0)
            return { id: c.id, customerNumber: c.customerNumber, name: c.name, segment: c.segment?.name, due }
        }).filter((c: any) => c.due > 0)

        const totalDue = result.reduce((s: number, r: any) => s + r.due, 0)
        return NextResponse.json({ rows: result, totalDue })
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
}
