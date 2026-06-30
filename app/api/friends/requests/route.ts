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

// Send friend request
export async function POST(request: NextRequest) {
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
    const { recipientEmail } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail required' },
        { status: 400 }
      );
    }

    // Find recipient
    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (recipient.id === userId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if already friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: recipient.id },
          { user1Id: recipient.id, user2Id: userId },
        ],
      },
    });

    if (friendship) {
      return NextResponse.json(
        { error: 'Already friends' },
        { status: 400 }
      );
    }

    // Prevent duplicate pending requests in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: recipient.id },
          { requesterId: recipient.id, receiverId: userId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 400 }
        );
      }
      if (existingRequest.status === 'accepted') {
        const existingFriendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { user1Id: userId, user2Id: recipient.id },
              { user1Id: recipient.id, user2Id: userId },
            ],
          },
        });

        if (existingFriendship) {
          return NextResponse.json(
            { error: 'Already friends' },
            { status: 400 }
          );
        }

        await prisma.friendRequest.delete({ where: { id: existingRequest.id } });
      } else if (existingRequest.status === 'rejected') {
        await prisma.friendRequest.update({
          where: { id: existingRequest.id },
          data: { status: 'pending', requesterId: userId, receiverId: recipient.id },
        });
        return NextResponse.json({ message: 'Friend request re-sent' }, { status: 201 });
      }
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        requesterId: userId,
        receiverId: recipient.id,
        status: 'pending',
      },
    });

    return NextResponse.json(friendRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

// Get pending friend requests
export async function GET(request: NextRequest) {
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

    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        requestee: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}
