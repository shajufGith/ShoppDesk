import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany()
        console.log('Current Users:', JSON.stringify(users, null, 2))
        const businesses = await prisma.business.findMany()
        console.log('Current Businesses:', JSON.stringify(businesses, null, 2))
    } catch (e) {
        console.error('Error checking data:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
