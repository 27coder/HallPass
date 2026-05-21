import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

const demoAccounts = {
  'admin@example.com': {
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  'teacher@example.com': {
    password: 'teacher123',
    name: 'Ms. Teacher',
    role: 'teacher',
  },
  'student@example.com': {
    password: 'student123',
    name: 'Student User',
    role: 'student',
  },
} as const

async function ensureDemoAccounts() {
  const adminPassword = await bcrypt.hash(demoAccounts['admin@example.com'].password, 10)
  const teacherPassword = await bcrypt.hash(demoAccounts['teacher@example.com'].password, 10)
  const studentPassword = await bcrypt.hash(demoAccounts['student@example.com'].password, 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: demoAccounts['admin@example.com'].name,
      password: adminPassword,
      role: demoAccounts['admin@example.com'].role,
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      name: demoAccounts['teacher@example.com'].name,
      password: teacherPassword,
      role: demoAccounts['teacher@example.com'].role,
    },
  })

  await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: { teacherId: teacher.id },
    create: {
      email: 'student@example.com',
      name: demoAccounts['student@example.com'].name,
      password: studentPassword,
      role: demoAccounts['student@example.com'].role,
      teacherId: teacher.id,
    },
  })
}

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

          const email = credentials.email.trim().toLowerCase()
          
          let user = await prisma.user.findUnique({ where: { email } })
          if (!user) {
            const demoAccount = demoAccounts[email as keyof typeof demoAccounts]

            if (!demoAccount || credentials.password !== demoAccount.password) {
              console.error('User not found:', email)
              return null
            }

            await ensureDemoAccounts()
            user = await prisma.user.findUnique({ where: { email } })

            if (!user) {
              console.error('Demo account could not be created:', email)
              return null
            }
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            console.error('Invalid password for:', email)
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
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token?.role) {
        session.user.role = token.role
      }
      if (token?.id) {
        session.user.id = token.id
      }
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

