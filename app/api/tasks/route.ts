import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { title, listId } = body

    if (!title || !listId) {
      return NextResponse.json(
        { error: 'Title and listId are required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title,
        listId,
      },
    })

    return NextResponse.json(task, {
      status: 201,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}