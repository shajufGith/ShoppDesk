import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create default Manager account
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const manager = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            name: 'Shop Manager',
            username: 'admin',
            passwordHash: hashedPassword,
            role: Role.MANAGER,
            designation: 'Manager',
            isActive: true,
        },
    })
    console.log(`✅ Manager created: ${manager.username} (password: admin123)`)

    // Create default AppSettings row
    await prisma.appSettings.upsert({
        where: { id: 'singleton' },
        update: {},
        create: {
            id: 'singleton',
            customerIdMode: 'AUTO',
            customerPrefix: 'CUST',
            nextAutoNumber: 1,
        },
    })
    console.log('✅ App settings initialized')

    // Create a sample segment
    await prisma.customerSegment.upsert({
        where: { name: 'General' },
        update: {},
        create: { name: 'General' },
    })
    console.log('✅ Default segment created')

    console.log('\n🎉 Seed complete!')
    console.log('   Login with: admin / admin123')
    console.log('   ⚠️  Please change the password after first login!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
