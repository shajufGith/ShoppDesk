import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function totalWipe() {
    try {
        console.log('Starting total database wipe...')

        // 1. Reset search_path to default
        console.log('Resetting search_path...')
        await prisma.$executeRawUnsafe(`ALTER ROLE "neondb_owner" SET search_path TO public, "$user"`)

        // 2. Drop all tables in public schema
        console.log('Dropping all tables in "public" schema...')
        const publicTables: any[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `
        for (const t of publicTables) {
            console.log(`Dropping public."${t.table_name}"...`)
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${t.table_name}" CASCADE`)
        }

        // 3. Drop all tables in shopdesk schema
        console.log('Dropping all tables in "shopdesk" schema...')
        const sdTables: any[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'shopdesk' AND table_type = 'BASE TABLE'
        `
        for (const t of sdTables) {
            console.log(`Dropping shopdesk."${t.table_name}"...`)
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "shopdesk"."${t.table_name}" CASCADE`)
        }

        // 4. Also drop any custom types (enums)
        console.log('Dropping custom types...')
        const types = ['Role', 'TransactionType', 'CustomerIdMode']
        for (const type of types) {
            await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${type}" CASCADE`)
            await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "public"."${type}" CASCADE`)
            await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "shopdesk"."${type}" CASCADE`)
        }

        console.log('TOTAL WIPE COMPLETE.')
    } catch (error) {
        console.error('Wipe failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

totalWipe()
