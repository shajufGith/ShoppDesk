import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const segments = await prisma.customerSegment.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(segments)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const segment = await prisma.customerSegment.create({ data: { name } })
    return NextResponse.json(segment, { status: 201 })
}
