import { NextRequest, NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PATCH update employee
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Ensure the user belongs to the business
    const existing = await prisma.user.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    if (session.user.role !== 'MANAGER')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Prevent deleting yourself
    if (params.id === session.user.id)
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

    // Ensure the user belongs to the business
    const existing = await prisma.user.findFirst({
        where: { id: params.id, businessId: session.user.businessId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
}
