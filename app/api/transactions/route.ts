import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// GET transactions for the current business
export async function GET(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type') as any
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const txns = await prisma.transaction.findMany({
        where: {
            businessId: session.user.businessId,
            ...(customerId ? { customerId } : {}),
            ...(type ? { type } : {}),
            ...(from || to ? {
                date: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to) } : {}),
                },
            } : {}),
        },
        include: {
            customer: { select: { id: true, customerNumber: true, name: true } },
            createdBy: { select: { id: true, name: true } },
        },
        orderBy: { date: 'asc' },
    })
    return NextResponse.json(txns)
}

// POST create transaction
export async function POST(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const { customerId, type, amount, date, note, paymentMode } = await req.json()

    if (!customerId || !type || !amount)
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    if (!['OPENING', 'SALES', 'COLLECTION'].includes(type))
        return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })

    const businessId = session.user.businessId

    // Only one OPENING balance per customer within the business
    if (type === 'OPENING') {
        const existing = await prisma.transaction.findFirst({
            where: { businessId, customerId, type: 'OPENING' }
        })
        if (existing) return NextResponse.json({ error: 'Opening balance already set. Use update.' }, { status: 409 })
    }

    const txn = await prisma.transaction.create({
        data: {
            businessId,
            customerId, type,
            amount: parseFloat(amount),
            date: date ? new Date(date) : new Date(),
            note: note || null,
            paymentMode: paymentMode || null,
            createdById: session.user.id,
        },
        include: {
            customer: { select: { id: true, customerNumber: true, name: true } },
            createdBy: { select: { id: true, name: true } },
        },
    })
    return NextResponse.json(txn, { status: 201 })
}
