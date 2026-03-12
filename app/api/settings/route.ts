import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const settings = await prisma.appSettings.findUnique({
        where: { businessId: session.user.businessId }
    })
    return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { customerIdMode, customerPrefix } = await req.json()

    const settings = await prisma.appSettings.update({
        where: { businessId: session.user.businessId },
        data: {
            ...(customerIdMode ? { customerIdMode } : {}),
            ...(customerPrefix ? { customerPrefix } : {}),
        },
    })
    return NextResponse.json(settings)
}
