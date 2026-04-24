'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role === 'student') {
      router.push('/student')
    } else if (session.user.role === 'teacher') {
      router.push('/teacher')
    } else if (session.user.role === 'admin') {
      router.push('/admin')
    }
  }, [session, status, router])

  return <div>Loading...</div>
}