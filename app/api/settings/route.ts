import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let settings = await prisma.appSettings.findUnique({
        where: { businessId: session.user.businessId }
    })

    if (!settings) {
        settings = await prisma.appSettings.create({
            data: {
                businessId: session.user.businessId,
                customerIdMode: 'AUTO',
                customerPrefix: 'CUST',
                nextAutoNumber: 1
            }
        })
    }

    return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { customerIdMode, customerPrefix } = await req.json()

    const settings = await prisma.appSettings.upsert({
        where: { businessId: session.user.businessId },
        update: {
            ...(customerIdMode ? { customerIdMode } : {}),
            ...(customerPrefix ? { customerPrefix } : {}),
        },
        create: {
            businessId: session.user.businessId,
            customerIdMode: customerIdMode || 'AUTO',
            customerPrefix: customerPrefix || 'CUST',
            nextAutoNumber: 1
        }
    })
    return NextResponse.json(settings)
}
