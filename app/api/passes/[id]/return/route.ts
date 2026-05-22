import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeRoomCode } from '@/lib/sanitize'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'teacher' && session.user.role !== 'admin' && session.user.role !== 'student')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate ID format
  const id = params.id
  if (!id || id.length < 5) {
    return NextResponse.json({ error: 'Invalid pass ID' }, { status: 400 })
  }

  const pass = await prisma.pass.findUnique({ where: { id: id } })
  if (!pass || pass.status !== 'approved') {
    return NextResponse.json({ error: 'Invalid pass' }, { status: 400 })
  }

  // Authorization: students can only return their own passes, teachers/admins can return any
  if (session.user.role === 'student' && pass.studentId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (session.user.role === 'teacher') {
    const student = await prisma.user.findUnique({ where: { id: pass.studentId } })
    if (!student || student.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  await prisma.pass.update({
    where: { id: id },
    data: { status: 'returned', returnedAt: new Date() }
  })

  return NextResponse.json({ message: 'Pass returned' }, { status: 200 })
}