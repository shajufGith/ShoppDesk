import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const customer = await prisma.customer.findUnique({
        where: { id: params.id },
        include: { segment: { select: { id: true, name: true } } },
    })
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, address1, address2, mobile, segmentId } = await req.json()
    const customer = await prisma.customer.update({
        where: { id: params.id },
        data: { name, address1, address2, mobile, segmentId: segmentId || null },
        include: { segment: { select: { id: true, name: true } } },
    })
    return NextResponse.json(customer)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.customer.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
}
