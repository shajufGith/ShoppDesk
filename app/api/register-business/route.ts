import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
    try {
        const { businessName, address, adminName, username, password } = await req.json()

        if (!businessName || !adminName || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { username } })
        if (existingUser) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        // Create business, settings, and admin user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const business = await tx.business.create({
                data: {
                    name: businessName,
                    address: address,
                }
            })

            await tx.appSettings.create({
                data: {
                    businessId: business.id,
                    customerIdMode: 'AUTO',
                    customerPrefix: 'CUST',
                    nextAutoNumber: 1
                }
            })

            const user = await tx.user.create({
                data: {
                    name: adminName,
                    username,
                    passwordHash,
                    role: 'MANAGER',
                    designation: 'Owner',
                    businessId: business.id,
                    isActive: true
                }
            })

            return { business, user }
        })

        return NextResponse.json({ message: 'Registration successful', businessId: result.business.id })
    } catch (error: any) {
        console.error('Registration error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
