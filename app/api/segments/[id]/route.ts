import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Ensure it belongs to the business
    const existing = await prisma.customerSegment.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    try {
        await prisma.customerSegment.delete({ where: { id: params.id } })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Segment may have customers assigned. Reassign first.' }, { status: 409 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Ensure it belongs to the business
    const existing = await prisma.customerSegment.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { name } = await req.json()
    const segment = await prisma.customerSegment.update({
        where: { id: params.id },
        data: { name }
    })
    return NextResponse.json(segment)
}
