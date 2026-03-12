import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET transactions for a customer
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type') as any
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const txns = await prisma.transaction.findMany({
        where: {
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
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { customerId, type, amount, date, note } = await req.json()

    if (!customerId || !type || !amount)
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    if (!['OPENING', 'SALES', 'COLLECTION'].includes(type))
        return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })

    // Only one OPENING balance per customer
    if (type === 'OPENING') {
        const existing = await prisma.transaction.findFirst({ where: { customerId, type: 'OPENING' } })
        if (existing) return NextResponse.json({ error: 'Opening balance already set. Use update.' }, { status: 409 })
    }

    const txn = await prisma.transaction.create({
        data: {
            customerId, type,
            amount: parseFloat(amount),
            date: date ? new Date(date) : new Date(),
            note: note || null,
            createdById: (session.user as any).id,
        },
        include: {
            customer: { select: { id: true, customerNumber: true, name: true } },
            createdBy: { select: { id: true, name: true } },
        },
    })
    return NextResponse.json(txn, { status: 201 })
}
