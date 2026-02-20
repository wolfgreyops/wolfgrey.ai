const TYPEFULLY_API = 'https://api.typefully.com/v1';

function getApiKey(): string {
  const key = process.env.TYPEFULLY_API_KEY;
  if (!key) {
    throw new Error('TYPEFULLY_API_KEY not configured');
  }
  return key;
}

export async function postTweet(text: string): Promise<{ id: string; text: string }> {
  const response = await fetch(`${TYPEFULLY_API}/drafts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': getApiKey(),
    },
    body: JSON.stringify({
      content: text,
      schedule_date: 'next-free-slot',
      auto_schedule: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Typefully API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    id: data.id?.toString() || 'pending',
    text: text,
  };
}

export async function postThread(tweets: string[]): Promise<{ ids: string[] }> {
  // Typefully expects threads as content separated by 4 newlines
  const threadContent = tweets.join('\n\n\n\n');

  const response = await fetch(`${TYPEFULLY_API}/drafts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': getApiKey(),
    },
    body: JSON.stringify({
      content: threadContent,
      threadify: true,
      schedule_date: 'next-free-slot',
      auto_schedule: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Typefully API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    ids: [data.id?.toString() || 'pending'],
  };
}
