import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'teacher' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pass = await prisma.pass.findUnique({ where: { id: params.id } })
  if (!pass || pass.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid pass' }, { status: 400 })
  }

  await prisma.pass.update({
    where: { id: params.id },
    data: { status: 'denied', teacherId: session.user.id }
  })

  return NextResponse.json({ message: 'Pass denied' })
}