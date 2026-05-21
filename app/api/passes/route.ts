import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeInput, sanitizeRoomCode, validateInput } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { fromRoom, to, notes } = body

  // Input validation
  const fromRoomValidation = validateInput(fromRoom, 'From Room', 1, 50)
  if (!fromRoomValidation.valid) {
    return NextResponse.json({ error: fromRoomValidation.error }, { status: 400 })
  }

  const toValidation = validateInput(to, 'Destination', 1, 50)
  if (!toValidation.valid) {
    return NextResponse.json({ error: toValidation.error }, { status: 400 })
  }

  if (notes && typeof notes === 'string') {
    const notesValidation = validateInput(notes, 'Notes', 0, 300)
    if (!notesValidation.valid) {
      return NextResponse.json({ error: notesValidation.error }, { status: 400 })
    }
  }

  const student = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!student || student.role !== 'student') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  // Sanitize inputs before storing
  const sanitizedFromRoom = sanitizeRoomCode(fromRoom)
  const sanitizedTo = sanitizeRoomCode(to)
  const sanitizedNotes = notes ? sanitizeInput(notes, 300) : null

  const pass = await prisma.pass.create({
    data: {
      studentId: student.id,
      teacherId: student.teacherId ?? undefined,
      fromRoom: sanitizedFromRoom,
      to: sanitizedTo,
      notes: sanitizedNotes,
    }
  })

  return NextResponse.json({ message: 'Pass requested', id: pass.id })
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
    const students: Array<{ id: string }> = await prisma.user.findMany({
      where: { teacherId: session.user.id },
      select: { id: true }
    })
    where.studentId = { in: students.map((s) => s.id) }
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