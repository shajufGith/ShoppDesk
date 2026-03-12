import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username },
                })

                if (!user || !user.isActive) return null

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
                if (!isValid) return null

                return {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role as 'MANAGER' | 'EMPLOYEE',
                    designation: user.designation ?? '',
                    businessId: user.businessId,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.designation = (user as any).designation
                token.businessId = (user as any).businessId
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as 'MANAGER' | 'EMPLOYEE'
                session.user.designation = token.designation as string
                session.user.businessId = token.businessId as string
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
}
