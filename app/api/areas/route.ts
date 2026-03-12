import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const areas = await prisma.customerArea.findMany({
        where: { businessId: session.user.businessId },
        orderBy: { name: 'asc' }
    })
    return NextResponse.json(areas)
}

export async function POST(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const area = await prisma.customerArea.create({
        data: {
            name,
            businessId: session.user.businessId
        }
    })
    return NextResponse.json(area, { status: 201 })
}
