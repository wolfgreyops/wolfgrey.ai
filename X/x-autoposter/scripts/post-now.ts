/**
 * Post a tweet immediately via Typefully
 * Usage: npm run post -- "Your tweet text here"
 */

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

  const apiKey = process.env.TYPEFULLY_API_KEY;
  if (!apiKey) {
    console.error('TYPEFULLY_API_KEY not set');
    process.exit(1);
  }

  console.log('Posting via Typefully...');
  console.log(`"${text}"`);
  console.log(`(${text.length}/280 chars)\n`);

  try {
    const response = await fetch('https://api.typefully.com/v1/drafts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        content: text,
        schedule_date: 'next-free-slot',
        auto_schedule: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    console.log('Scheduled successfully!');
    console.log(`Draft ID: ${data.id}`);
  } catch (error) {
    console.error('Failed to post:', error);
    process.exit(1);
  }
}

postNow();
