import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export async function getBusinessSession() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.businessId) {
        return null
    }
    return session
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
