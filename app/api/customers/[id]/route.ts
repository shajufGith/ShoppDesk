import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const customer = await prisma.customer.findFirst({
        where: { id: params.id, businessId: session.user.businessId },
        include: {
            segment: { select: { id: true, name: true } },
            area: { select: { id: true, name: true } }
        },
    })
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const { name, address1, address2, mobile, segmentId, areaId } = await req.json()

    // Ensure the customer belongs to the business
    const existing = await prisma.customer.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const customer = await prisma.customer.update({
        where: { id: params.id },
        data: {
            name, address1, address2, mobile,
            segmentId: segmentId || null,
            areaId: areaId || null
        },
        include: {
            segment: { select: { id: true, name: true } },
            area: { select: { id: true, name: true } }
        },
    })
    return NextResponse.json(customer)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    // Ensure the customer belongs to the business
    const existing = await prisma.customer.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.customer.update({
        where: { id: params.id },
        data: { isActive: false }
    })
    return NextResponse.json({ success: true })
}
