import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fromRoom, to, notes } = await req.json()

  const student = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!student || student.role !== 'student') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const pass = await prisma.pass.create({
    data: {
      studentId: student.id,
      fromRoom,
      to,
      notes,
    }
  })

  return NextResponse.json({ message: 'Pass requested' })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let where: any = {}
  if (session.user.role === 'student') {
    where.studentId = session.user.id
  } else if (session.user.role === 'teacher') {
    const students = await prisma.user.findMany({ where: { teacherId: session.user.id } })
    where.studentId = { in: students.map(s => s.id) }
  } else if (session.user.role === 'admin') {
    // all
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (status) {
    where.status = status
  }

  const passes = await prisma.pass.findMany({
    where,
    include: {
      student: { select: { name: true } },
      teacher: { select: { name: true } }
    }
  })

  return NextResponse.json(passes)
}