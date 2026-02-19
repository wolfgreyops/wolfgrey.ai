/**
 * Post a tweet immediately (bypasses queue)
 * Usage: npm run post -- "Your tweet text here"
 */

import { TwitterApi } from 'twitter-api-v2';

async function postNow() {
  const text = process.argv.slice(2).join(' ');

  if (!text) {
    console.log('Usage: npm run post -- "Your tweet text here"');
    process.exit(1);
  }

  if (text.length > 280) {
    console.error(`Tweet too long: ${text.length}/280 characters`);
    process.exit(1);
  }

  const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });

  console.log('Posting tweet...');
  console.log(`"${text}"`);
  console.log(`(${text.length}/280 chars)\n`);

  try {
    const result = await client.v2.tweet(text);
    console.log('Posted successfully!');
    console.log(`Tweet ID: ${result.data.id}`);
    console.log(`URL: https://twitter.com/i/web/status/${result.data.id}`);
  } catch (error) {
    console.error('Failed to post:', error);
    process.exit(1);
  }
}

postNow();
