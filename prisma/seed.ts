import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create default Business
    const business = await prisma.business.upsert({
        where: { id: 'default-idx' },
        update: {},
        create: {
            id: 'default-idx',
            name: 'ShopDesk Demo',
            address: '123 Business Road, Suite 100',
        },
    })
    console.log('✅ Default business created')

    // Create default Manager account
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const manager = await prisma.user.upsert({
        where: { username: 'admin' },
        update: { businessId: business.id },
        create: {
            name: 'Shop Manager',
            username: 'admin',
            passwordHash: hashedPassword,
            role: Role.MANAGER,
            designation: 'Manager',
            isActive: true,
            businessId: business.id,
        },
    })
    console.log(`✅ Manager created: ${manager.username} (password: admin123)`)

    // Create default AppSettings row
    await prisma.appSettings.upsert({
        where: { businessId: business.id },
        update: {},
        create: {
            customerIdMode: 'AUTO',
            customerPrefix: 'CUST',
            nextAutoNumber: 1,
            businessId: business.id,
        },
    })
    console.log('✅ App settings initialized')

    // Create a sample segment
    await prisma.customerSegment.upsert({
        where: { businessId_name: { businessId: business.id, name: 'General' } },
        update: {},
        create: {
            name: 'General',
            businessId: business.id
        },
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
