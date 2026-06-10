import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const lists = await prisma.list.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(lists)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, userId } = body

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      )
    }

    const list = await prisma.list.create({
      data: {
        name,
        userId,
      },
    })

    return NextResponse.json(list, {
      status: 201,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    )
  }
}