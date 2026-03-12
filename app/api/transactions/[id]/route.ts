import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, date, note } = await req.json()
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
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.transaction.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
}
