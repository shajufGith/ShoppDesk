import NextAuth from 'next-auth'

declare module 'next-auth' {
    interface User {
        id: string
        role: 'MANAGER' | 'EMPLOYEE'
        designation: string
    }

    interface Session {
        user: {
            id: string
            name: string
            role: 'MANAGER' | 'EMPLOYEE'
            designation: string
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: 'MANAGER' | 'EMPLOYEE'
        designation: string
    }
}
