import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// GET all active customers for the current business
export async function GET(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const segmentId = searchParams.get('segmentId') ?? undefined
    const areaId = searchParams.get('areaId') ?? undefined

    const customers = await prisma.customer.findMany({
        where: {
            businessId: session.user.businessId,
            isActive: true,
            ...(segmentId ? { segmentId } : {}),
            ...(areaId ? { areaId } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { customerNumber: { contains: search, mode: 'insensitive' } },
                    { mobile: { contains: search } },
                ],
            } : {}),
        },
        include: {
            segment: { select: { id: true, name: true } },
            area: { select: { id: true, name: true } }
        },
        orderBy: { name: 'asc' },
    })
    return NextResponse.json(customers)
}

// POST create customer
export async function POST(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const { name, address1, address2, mobile, segmentId, areaId, customerNumber: manualNumber } = await req.json()
    if (!name || !address1 || !mobile)
        return NextResponse.json({ error: 'Name, address and mobile are required' }, { status: 400 })

    const businessId = session.user.businessId

    // Determine customer number based on business settings
    const settings = await prisma.appSettings.findUnique({ where: { businessId } })
    let customerNumber: string

    if (settings?.customerIdMode === 'MANUAL') {
        if (!manualNumber) return NextResponse.json({ error: 'Customer number is required' }, { status: 400 })
        customerNumber = manualNumber
    } else {
        // Auto mode — generate and increment atomically for THIS business
        const updated = await prisma.appSettings.update({
            where: { businessId },
            data: { nextAutoNumber: { increment: 1 } },
        })
        const num = updated.nextAutoNumber - 1
        const prefix = updated.customerPrefix ?? 'CUST'
        customerNumber = `${prefix}-${String(num).padStart(4, '0')}`
    }

    // Check uniqueness within the business
    const existing = await prisma.customer.findUnique({
        where: {
            businessId_customerNumber: { businessId, customerNumber }
        }
    })
    if (existing) return NextResponse.json({ error: 'Customer number already exists' }, { status: 409 })

    const customer = await prisma.customer.create({
        data: {
            businessId,
            name, address1, address2, mobile,
            segmentId: segmentId || null,
            areaId: areaId || null,
            customerNumber,
            createdById: session.user.id,
        },
        include: {
            segment: { select: { id: true, name: true } },
            area: { select: { id: true, name: true } }
        },
    })
    return NextResponse.json(customer, { status: 201 })
}
