import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyContent } from '@/lib/claude';
import { addToQueue, getQueueStats } from '@/lib/content-queue';

// Verify the request is from Vercel Cron or has proper auth
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }
  return process.env.NODE_ENV === 'development';
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if we already have enough content
    const stats = await getQueueStats();
    if (stats.pending >= 7) {
      return NextResponse.json({
        success: true,
        message: `Queue already has ${stats.pending} pending posts, skipping generation`,
        generated: 0,
      });
    }

    // Generate next week's content
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));

    const posts = await generateWeeklyContent(nextMonday);
    await addToQueue(posts);

    return NextResponse.json({
      success: true,
      generated: posts.length,
      startDate: nextMonday.toISOString(),
      themes: posts.map((p) => p.theme),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POST for manual generation with custom start date
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const startDate = body.startDate ? new Date(body.startDate) : new Date();

    const posts = await generateWeeklyContent(startDate);
    await addToQueue(posts);

    return NextResponse.json({
      success: true,
      generated: posts.length,
      startDate: startDate.toISOString(),
      posts: posts.map((p) => ({
        theme: p.theme,
        scheduledFor: p.scheduledFor,
        type: p.type,
        preview: Array.isArray(p.content)
          ? p.content[0].slice(0, 50) + '...'
          : p.content.slice(0, 50) + '...',
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
