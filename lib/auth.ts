import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing email or password')
            return null
          }
          
          const user = await prisma.user.findUnique({ where: { email: credentials.email } })
          if (!user) {
            console.error('User not found:', credentials.email)
            return null
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            console.error('Invalid password for:', credentials.email)
            return null
          }
          
          return { id: user.id, name: user.name, email: user.email, role: user.role }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      session.user.role = token.role
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as const
  }
}