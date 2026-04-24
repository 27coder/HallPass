const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const teacherPassword = await bcrypt.hash('teacher123', 10)
  const studentPassword = await bcrypt.hash('student123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      name: 'Ms. Teacher',
      email: 'teacher@example.com',
      password: teacherPassword,
      role: 'teacher',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: 'Student User',
      email: 'student@example.com',
      password: studentPassword,
      role: 'student',
      teacherId: teacher.id,
    },
  })

  await prisma.pass.upsert({
    where: { id: 'seed-pass-1' },
    update: {},
    create: {
      id: 'seed-pass-1',
      studentId: student.id,
      fromRoom: '101',
      to: 'Library',
      notes: 'Study hall',
      status: 'pending',
    },
  })

  console.log('Seed complete: admin, teacher, student, and sample pass created.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
