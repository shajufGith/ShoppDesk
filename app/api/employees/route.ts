import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET all employees (Manager only)
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const employees = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, username: true, role: true, designation: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(employees)
}

// POST create employee (Manager only)
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, username, password, role, designation } = await req.json()
    if (!name || !username || !password || !role)
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
        data: { name, username, passwordHash, role, designation, isActive: true },
        select: { id: true, name: true, username: true, role: true, designation: true, isActive: true },
    })
    return NextResponse.json(user, { status: 201 })
}
