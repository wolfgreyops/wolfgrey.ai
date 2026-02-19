import { NextRequest, NextResponse } from 'next/server';
import { getNextPost, markAsPosted, markAsFailed } from '@/lib/content-queue';
import { postTweet, postThread } from '@/lib/x-client';

// Verify the request is from Vercel Cron
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }
  // In development, allow without secret
  return process.env.NODE_ENV === 'development';
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const post = await getNextPost();

    if (!post) {
      return NextResponse.json({
        success: true,
        message: 'No posts due',
        posted: false,
      });
    }

    let tweetId: string;

    if (post.type === 'thread' && Array.isArray(post.content)) {
      const result = await postThread(post.content);
      tweetId = result.ids[0]; // First tweet ID
    } else {
      const content = Array.isArray(post.content) ? post.content[0] : post.content;
      const result = await postTweet(content);
      tweetId = result.id;
    }

    await markAsPosted(post.id, tweetId);

    return NextResponse.json({
      success: true,
      posted: true,
      postId: post.id,
      tweetId,
      theme: post.theme,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Try to mark the post as failed if we have one
    try {
      const post = await getNextPost();
      if (post) {
        await markAsFailed(post.id, errorMessage);
      }
    } catch {
      // Ignore errors in error handling
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
