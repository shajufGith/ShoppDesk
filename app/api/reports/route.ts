import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// GET /api/reports?type=statement|sales|collection|due&from=&to=&customerId=&segmentId=&areaId=
export async function GET(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'statement'
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const customerId = searchParams.get('customerId') ?? undefined
    const segmentId = searchParams.get('segmentId') ?? undefined
    const areaId = searchParams.get('areaId') ?? undefined

    const businessId = session.user.businessId

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
                businessId,
                isActive: true,
                ...(customerId ? { id: customerId } : {}),
                ...(segmentId ? { segmentId } : {}),
                ...(areaId ? { areaId } : {}),
            },
            include: {
                segment: { select: { name: true } },
                area: { select: { name: true } },
                transactions: {
                    where: { businessId, ...dateFilter },
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
            return {
                customer: {
                    id: c.id,
                    customerNumber: c.customerNumber,
                    name: c.name,
                    segment: c.segment?.name,
                    area: c.area?.name
                },
                rows,
                closingBalance: balance
            }
        })
        return NextResponse.json(result)
    }

    // ── Sales / Collection Totals ─────────────────────────────────────────────────
    if (type === 'sales' || type === 'collection') {
        const txnType = type === 'sales' ? 'SALES' : 'COLLECTION'
        const rows = await prisma.transaction.findMany({
            where: {
                businessId,
                type: txnType as any,
                ...dateFilter,
                ...(customerId ? { customerId } : {}),
                ...(segmentId || areaId ? {
                    customer: {
                        ...(segmentId ? { segmentId } : {}),
                        ...(areaId ? { areaId } : {})
                    }
                } : {})
            },
            include: {
                customer: {
                    select: {
                        customerNumber: true,
                        name: true,
                        segment: { select: { name: true } },
                        area: { select: { name: true } }
                    }
                },
                createdBy: { select: { name: true } }
            },
            orderBy: { date: 'asc' },
        })
        const total = rows.reduce((s: number, r: any) => s + Number(r.amount), 0)
        return NextResponse.json({ rows, total })
    }

    // ── Amount Due ────────────────────────────────────────────────────────────────
    if (type === 'due') {
        const customers = await prisma.customer.findMany({
            where: {
                businessId,
                isActive: true,
                ...(segmentId ? { segmentId } : {}),
                ...(areaId ? { areaId } : {})
            },
            include: {
                segment: { select: { name: true } },
                area: { select: { name: true } },
                transactions: { select: { type: true, amount: true } },
            },
            orderBy: { name: 'asc' },
        })

        const result = customers.map((c: any) => {
            const due = c.transactions.reduce((sum: number, t: any) => {
                const amt = Number(t.amount)
                return t.type === 'COLLECTION' ? sum - amt : sum + amt
            }, 0)
            return {
                id: c.id,
                customerNumber: c.customerNumber,
                name: c.name,
                segment: c.segment?.name,
                area: c.area?.name,
                due
            }
        }).filter((c: any) => c.due > 0)

        const totalDue = result.reduce((s: number, r: any) => s + r.due, 0)
        return NextResponse.json({ rows: result, totalDue })
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
}
