import { NextResponse } from 'next/server'
import { getBusinessSession, unauthorizedResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getBusinessSession()
    if (!session) return unauthorizedResponse()

    const businessId = session.user.businessId

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
        openingAgg,
    ] = await Promise.all([
        prisma.customer.count({
            where: { businessId, isActive: true }
        }),
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { businessId, type: 'SALES' }
        }),
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { businessId, type: 'COLLECTION' }
        }),
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { businessId, type: 'SALES', date: { gte: today, lt: tomorrow } }
        }),
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { businessId, type: 'COLLECTION', date: { gte: today, lt: tomorrow } }
        }),
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { businessId, type: 'OPENING' }
        }),
    ])

    const totalSales = Number(salesAgg._sum.amount ?? 0)
    const totalCollection = Number(collectionAgg._sum.amount ?? 0)
    const totalOpening = Number(openingAgg._sum.amount ?? 0)

    // Total due: sum of (opening + sales - collection) per business
    const totalDue = totalOpening + totalSales - totalCollection

    return NextResponse.json({
        totalCustomers,
        totalSales,
        totalCollection,
        totalDue,
        todaySales: Number(todaySalesAgg._sum.amount ?? 0),
        todayCollection: Number(todayCollectionAgg._sum.amount ?? 0),
    })
}
