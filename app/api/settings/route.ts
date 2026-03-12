import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
    return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { customerIdMode, customerPrefix } = await req.json()

    const settings = await prisma.appSettings.update({
        where: { id: 'singleton' },
        data: {
            ...(customerIdMode ? { customerIdMode } : {}),
            ...(customerPrefix ? { customerPrefix } : {}),
        },
    })
    return NextResponse.json(settings)
}
