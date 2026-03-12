import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET all employees for the current business (Manager only)
export async function GET() {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const employees = await prisma.user.findMany({
        where: { businessId: session.user.businessId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, username: true, role: true, designation: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(employees)
}

// POST create employee for the current business (Manager only)
export async function POST(req: NextRequest) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, username, password, role, designation } = await req.json()
    if (!name || !username || !password || !role)
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
        data: {
            name,
            username,
            passwordHash,
            role,
            designation,
            isActive: true,
            businessId: session.user.businessId
        },
        select: { id: true, name: true, username: true, role: true, designation: true, isActive: true },
    })
    return NextResponse.json(user, { status: 201 })
}
