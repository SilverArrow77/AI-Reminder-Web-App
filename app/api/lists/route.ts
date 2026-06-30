import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/prisma'

function getUserIdFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string
      email: string
    }

    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lists = await prisma.list.findMany({
      where: {
        OR: [
          { userId },
          {
            listPermissions: {
              some: {
                friendId: userId,
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        listPermissions: {
          select: { friendId: true },
        },
      },
    })

    // Annotate lists so frontend can show "Shared" labels and know ownership
    const annotated = lists.map((l) => ({
      id: l.id,
      name: l.name,
      userId: l.userId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      isOwner: l.userId === userId,
      isCollaborator: (l.listPermissions || []).some((p) => p.friendId === userId),
    }))

    return NextResponse.json(annotated)
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
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
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