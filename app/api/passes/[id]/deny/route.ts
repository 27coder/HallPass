import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeRoomCode } from '@/lib/sanitize'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'teacher' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate ID format
  const id = sanitizeRoomCode(params.id).slice(0, 25)
  if (!id || id.length < 5) {
    return NextResponse.json({ error: 'Invalid pass ID' }, { status: 400 })
  }

  const pass = await prisma.pass.findUnique({ where: { id: params.id } })
  if (!pass || pass.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid pass' }, { status: 400 })
  }

  // Additional authorization: teachers can only deny passes from their students
  if (session.user.role === 'teacher') {
    const student = await prisma.user.findUnique({ where: { id: pass.studentId } })
    if (!student || student.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  await prisma.pass.update({
    where: { id: params.id },
    data: { status: 'denied', teacherId: session.user.id }
  })

  return NextResponse.json({ message: 'Pass denied' })
}
