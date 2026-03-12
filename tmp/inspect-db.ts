import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function inspectDb() {
    try {
        console.log('Inspecting shopdesk schema...')
        // Query information_schema for tables in the shopdesk schema
        const tables: any[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'shopdesk'
        `
        console.log('Tables found in shopdesk schema:', tables.map(t => t.table_name))

        if (tables.length === 0) {
            console.log('No tables found in shopdesk schema! Checking public schema...')
            const publicTables: any[] = await prisma.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `
            console.log('Tables found in public schema:', publicTables.map(t => t.table_name))
        }
    } catch (error) {
        console.error('Inspection failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

inspectDb()
