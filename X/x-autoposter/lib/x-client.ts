import { TwitterApi } from 'twitter-api-v2';

// Lazy initialization to avoid build-time errors
function getClient() {
  if (!process.env.X_API_KEY || !process.env.X_API_SECRET ||
      !process.env.X_ACCESS_TOKEN || !process.env.X_ACCESS_SECRET) {
    throw new Error('X API credentials not configured');
  }

  return new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  }).readWrite;
}

export async function postTweet(text: string): Promise<{ id: string; text: string }> {
  const client = getClient();
  const result = await client.v2.tweet(text);
  return {
    id: result.data.id,
    text: result.data.text,
  };
}

export async function postThread(tweets: string[]): Promise<{ ids: string[] }> {
  const client = getClient();
  const ids: string[] = [];
  let lastTweetId: string | undefined;

  for (const text of tweets) {
    const result = await client.v2.tweet(text, {
      reply: lastTweetId ? { in_reply_to_tweet_id: lastTweetId } : undefined,
    });
    ids.push(result.data.id);
    lastTweetId = result.data.id;
  }

  return { ids };
}
