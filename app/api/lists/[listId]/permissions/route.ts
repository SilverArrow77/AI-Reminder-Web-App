import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// Get list permissions for a specific list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { listId } = await params;

    // Verify ownership
    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list || list.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const permissions = await prisma.listPermission.findMany({
      where: { listId },
      include: {
        friend: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// Add or update permissions for a friend
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { friendId, friendEmail } = body;
    const { listId } = await params;

    if (!friendId && !friendEmail) {
      return NextResponse.json(
        { error: 'friendId or friendEmail is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list || list.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const friend = friendId
      ? await prisma.user.findUnique({ where: { id: friendId } })
      : await prisma.user.findUnique({ where: { email: friendEmail } });

    if (!friend) {
      return NextResponse.json(
        { error: 'Friend user not found' },
        { status: 404 }
      );
    }

    // Verify friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friend.id },
          { user1Id: friend.id, user2Id: userId },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Not friends with this user' },
        { status: 400 }
      );
    }

    const existing = await prisma.listPermission.findFirst({
      where: {
        listId,
        friendId: friend.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          friend: {
            id: friend.id,
            email: friend.email,
            username: friend.username,
          },
        },
        { status: 200 }
      );
    }

    const created = await prisma.listPermission.create({
      data: {
        listId,
        friendId: friend.id,
        canAdd: true,
        canEdit: false,
        canRemove: false,
      },
      include: {
        friend: {
          select: { id: true, email: true, username: true },
        },
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error managing permissions:', error);
    return NextResponse.json(
      { error: 'Failed to manage permissions' },
      { status: 500 }
    );
  }
}

// Remove permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { friendId } = body;
    const { listId } = await params;

    // Verify ownership
    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list || list.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    await prisma.listPermission.deleteMany({
      where: {
        listId,
        friendId,
      },
    });

    return NextResponse.json({ message: 'Collaborator removed' });
  } catch (error) {
    console.error('Error removing permissions:', error);
    return NextResponse.json(
      { error: 'Failed to remove permissions' },
      { status: 500 }
    );
  }
}
