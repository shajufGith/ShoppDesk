import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
        totalCustomers,
        salesAgg,
        collectionAgg,
        todaySalesAgg,
        todayCollectionAgg,
    ] = await Promise.all([
        prisma.customer.count({ where: { isActive: true } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'SALES' } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'COLLECTION' } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'SALES', date: { gte: today, lt: tomorrow } } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'COLLECTION', date: { gte: today, lt: tomorrow } } }),
    ])

    const totalSales = Number(salesAgg._sum.amount ?? 0)
    const totalCollection = Number(collectionAgg._sum.amount ?? 0)

    // Total due: sum of (opening + sales - collection) per customer
    const openingAgg = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'OPENING' } })
    const totalDue = Number(openingAgg._sum.amount ?? 0) + totalSales - totalCollection

    return NextResponse.json({
        totalCustomers,
        totalSales,
        totalCollection,
        totalDue,
        todaySales: Number(todaySalesAgg._sum.amount ?? 0),
        todayCollection: Number(todayCollectionAgg._sum.amount ?? 0),
    })
}
