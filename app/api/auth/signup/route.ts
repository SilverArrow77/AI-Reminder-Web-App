import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email, password, phone } = body

    if (!email || !password || !phone) {
      return NextResponse.json(
        { error: 'Email, password and phone are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        phoneNumber: phone,
        passwordHash: hashedPassword,
      },
    })

    await prisma.list.create({
      data: {
        name: 'Daily Task Lists',
        userId: user.id,
      },
    })

    return NextResponse.json(
      {
        message: 'User created successfully',
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}