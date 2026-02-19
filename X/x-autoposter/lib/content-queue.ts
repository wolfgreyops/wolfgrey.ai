import { Redis } from '@upstash/redis';

// Lazy initialization to avoid build-time errors
let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('Redis credentials not configured');
    }
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export interface QueuedPost {
  id: string;
  type: 'single' | 'thread';
  content: string | string[]; // string for single, string[] for thread
  scheduledFor: string; // ISO date string
  theme: string;
  status: 'pending' | 'posted' | 'failed';
  postedAt?: string;
  tweetId?: string;
  error?: string;
}

const QUEUE_KEY = 'x-autoposter:queue';
const POSTED_KEY = 'x-autoposter:posted';

export async function getQueue(): Promise<QueuedPost[]> {
  const queue = await getRedis().get<QueuedPost[]>(QUEUE_KEY);
  return queue || [];
}

export async function addToQueue(posts: Omit<QueuedPost, 'id' | 'status'>[]): Promise<void> {
  const queue = await getQueue();
  const newPosts: QueuedPost[] = posts.map((post, i) => ({
    ...post,
    id: `post-${Date.now()}-${i}`,
    status: 'pending',
  }));
  await getRedis().set(QUEUE_KEY, [...queue, ...newPosts]);
}

export async function getNextPost(): Promise<QueuedPost | null> {
  const queue = await getQueue();
  const now = new Date();

  // Find the first pending post that's due
  const nextPost = queue.find(
    (post) => post.status === 'pending' && new Date(post.scheduledFor) <= now
  );

  return nextPost || null;
}

export async function markAsPosted(
  postId: string,
  tweetId: string
): Promise<void> {
  const queue = await getQueue();
  const updatedQueue = queue.map((post) =>
    post.id === postId
      ? { ...post, status: 'posted' as const, postedAt: new Date().toISOString(), tweetId }
      : post
  );
  await getRedis().set(QUEUE_KEY, updatedQueue);

  // Also save to posted history
  const posted = await getRedis().get<QueuedPost[]>(POSTED_KEY) || [];
  const postedPost = updatedQueue.find(p => p.id === postId);
  if (postedPost) {
    await getRedis().set(POSTED_KEY, [...posted, postedPost]);
  }
}

export async function markAsFailed(postId: string, error: string): Promise<void> {
  const queue = await getQueue();
  const updatedQueue = queue.map((post) =>
    post.id === postId
      ? { ...post, status: 'failed' as const, error }
      : post
  );
  await getRedis().set(QUEUE_KEY, updatedQueue);
}

export async function getPostedHistory(): Promise<QueuedPost[]> {
  const posted = await getRedis().get<QueuedPost[]>(POSTED_KEY);
  return posted || [];
}

export async function clearPosted(): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter(post => post.status === 'pending');
  await getRedis().set(QUEUE_KEY, filtered);
}

export async function getQueueStats(): Promise<{
  pending: number;
  posted: number;
  failed: number;
  nextScheduled: string | null;
}> {
  const queue = await getQueue();
  const pending = queue.filter(p => p.status === 'pending');

  return {
    pending: pending.length,
    posted: queue.filter(p => p.status === 'posted').length,
    failed: queue.filter(p => p.status === 'failed').length,
    nextScheduled: pending.length > 0
      ? pending.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0].scheduledFor
      : null,
  };
}
