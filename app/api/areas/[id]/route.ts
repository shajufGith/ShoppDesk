import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Ensure it belongs to the business
    const existing = await prisma.customerArea.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check if any customers are using this area
    const inUse = await prisma.customer.findFirst({ where: { areaId: params.id } })
    if (inUse) return NextResponse.json({ error: 'Cannot delete area in use by customers' }, { status: 400 })

    await prisma.customerArea.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
}
