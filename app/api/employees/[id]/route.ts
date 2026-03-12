import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PATCH update employee
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, designation, role, isActive, password } = await req.json()
    const data: any = { name, designation, role, isActive }

    if (password) {
        data.passwordHash = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
        where: { id: params.id },
        data,
        select: { id: true, name: true, username: true, role: true, designation: true, isActive: true },
    })
    return NextResponse.json(user)
}

// DELETE employee
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Prevent deleting yourself
    if (params.id === (session.user as any).id)
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
}
