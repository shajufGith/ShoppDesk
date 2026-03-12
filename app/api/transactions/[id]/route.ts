import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const { amount, date, note } = await req.json()

    // Ensure the transaction belongs to the business
    const existing = await prisma.transaction.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const txn = await prisma.transaction.update({
        where: { id: params.id },
        data: {
            ...(amount !== undefined ? { amount: parseFloat(amount) } : {}),
            ...(date ? { date: new Date(date) } : {}),
            ...(note !== undefined ? { note } : {}),
        },
        include: {
            customer: { select: { id: true, customerNumber: true, name: true } },
            createdBy: { select: { id: true, name: true } },
        },
    })
    return NextResponse.json(txn)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    // Ensure the transaction belongs to the business
    const existing = await prisma.transaction.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.transaction.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
}
