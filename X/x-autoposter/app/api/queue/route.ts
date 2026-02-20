import { NextRequest, NextResponse } from 'next/server';
import {
  getQueue,
  addToQueue,
  getQueueStats,
  clearPosted,
  getPostedHistory,
} from '@/lib/content-queue';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET || process.env.API_SECRET;
  if (secret) {
    return authHeader === `Bearer ${secret}`;
  }
  return process.env.NODE_ENV === 'development';
}

// GET - View queue and stats
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get('view') || 'stats';

  if (view === 'all') {
    const queue = await getQueue();
    return NextResponse.json({ queue });
  }

  if (view === 'history') {
    const history = await getPostedHistory();
    return NextResponse.json({ history });
  }

  const stats = await getQueueStats();
  return NextResponse.json({ stats });
}

// POST - Add posts to queue
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const posts = Array.isArray(body) ? body : [body];

    await addToQueue(
      posts.map((post: { content: string | string[]; scheduledFor: string; theme?: string }) => ({
        type: Array.isArray(post.content) ? 'thread' as const : 'single' as const,
        content: post.content,
        scheduledFor: post.scheduledFor,
        theme: post.theme || 'manual',
      }))
    );

    return NextResponse.json({
      success: true,
      added: posts.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// DELETE - Clear posted items from queue
export async function DELETE(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await clearPosted();
  return NextResponse.json({ success: true, message: 'Cleared posted items' });
}
