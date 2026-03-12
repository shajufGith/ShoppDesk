import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all active customers
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const segmentId = searchParams.get('segmentId') ?? undefined

    const customers = await prisma.customer.findMany({
        where: {
            isActive: true,
            ...(segmentId ? { segmentId } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { customerNumber: { contains: search, mode: 'insensitive' } },
                    { mobile: { contains: search } },
                ],
            } : {}),
        },
        include: { segment: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
    })
    return NextResponse.json(customers)
}

// POST create customer
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, address1, address2, mobile, segmentId, customerNumber: manualNumber } = await req.json()
    if (!name || !address1 || !mobile)
        return NextResponse.json({ error: 'Name, address and mobile are required' }, { status: 400 })

    // Determine customer number
    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
    let customerNumber: string

    if (settings?.customerIdMode === 'MANUAL') {
        if (!manualNumber) return NextResponse.json({ error: 'Customer number is required' }, { status: 400 })
        customerNumber = manualNumber
    } else {
        // Auto mode — generate and increment atomically
        const updated = await prisma.appSettings.update({
            where: { id: 'singleton' },
            data: { nextAutoNumber: { increment: 1 } },
        })
        const num = updated.nextAutoNumber - 1
        const prefix = updated.customerPrefix ?? 'CUST'
        customerNumber = `${prefix}-${String(num).padStart(4, '0')}`
    }

    // Check uniqueness
    const existing = await prisma.customer.findUnique({ where: { customerNumber } })
    if (existing) return NextResponse.json({ error: 'Customer number already exists' }, { status: 409 })

    const customer = await prisma.customer.create({
        data: {
            name, address1, address2, mobile, segmentId: segmentId || null,
            customerNumber,
            createdById: (session.user as any).id,
        },
        include: { segment: { select: { id: true, name: true } } },
    })
    return NextResponse.json(customer, { status: 201 })
}
