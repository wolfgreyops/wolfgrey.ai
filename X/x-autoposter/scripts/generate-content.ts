/**
 * Generate a week of content using Claude API
 * Usage: npm run generate
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const CONTENT_PILLARS = [
  { day: 'Monday', theme: 'ROI/Results', description: 'Case study with specific numbers' },
  { day: 'Tuesday', theme: 'Tactical Tip', description: 'CRAFT prompt trick, Claude technique' },
  { day: 'Wednesday', theme: 'Mindset Shift', description: 'Hot take, industry observation' },
  { day: 'Thursday', theme: 'Tool/Workflow', description: 'Specific workflow walkthrough' },
  { day: 'Friday', theme: 'Thread', description: 'Deep-dive educational (5-7 tweets)' },
  { day: 'Saturday', theme: 'Community', description: 'Engagement question, poll' },
  { day: 'Sunday', theme: 'Soft Sell', description: 'Direct CTA to free guide/tools' },
];

const SYSTEM_PROMPT = `You are the content engine for wolfgrey.ai, creating X (Twitter) posts.

BRAND VOICE:
- Direct, operator-to-operator tone
- Results-first, no fluff
- Specific numbers over vague claims
- Never use: "revolutionary", "game-changing", "unlock the power"

PRODUCTS:
- Free Guide: wolfgrey.ai/guide?src=twitter
- Free Tools: wolfgrey.ai/tools?src=twitter
- $49 Playbook: wolfgrey.ai/playbook?src=twitter
- $199 Mastery: wolfgrey.ai/mastery?src=twitter

RULES:
- Single tweets under 280 characters
- Provide real value, not hype`;

async function generateWeek() {
  console.log('Generating 7 days of content...\n');

  const posts: Array<{
    day: string;
    theme: string;
    type: 'single' | 'thread';
    content: string | string[];
  }> = [];

  for (const pillar of CONTENT_PILLARS) {
    const isThread = pillar.theme === 'Thread';

    const prompt = isThread
      ? `Generate a Twitter thread (5-6 tweets) for ${pillar.day}.
Theme: ${pillar.theme}
Description: ${pillar.description}

Return ONLY a JSON array of tweet strings.
Last tweet should have CTA to wolfgrey.ai/guide?src=twitter`
      : `Generate a single tweet for ${pillar.day}.
Theme: ${pillar.theme}
Description: ${pillar.description}

Return ONLY the tweet text. Under 280 characters.`;

    process.stdout.write(`${pillar.day} (${pillar.theme})... `);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') continue;

    if (isThread) {
      try {
        const tweets = JSON.parse(content.text);
        posts.push({ day: pillar.day, theme: pillar.theme, type: 'thread', content: tweets });
        console.log(`Thread (${tweets.length} tweets)`);
      } catch {
        posts.push({ day: pillar.day, theme: pillar.theme, type: 'single', content: content.text });
        console.log('Single (fallback)');
      }
    } else {
      posts.push({ day: pillar.day, theme: pillar.theme, type: 'single', content: content.text });
      console.log('Single');
    }
  }

  console.log('\n--- GENERATED CONTENT ---\n');

  for (const post of posts) {
    console.log(`## ${post.day} - ${post.theme}\n`);
    if (post.type === 'thread' && Array.isArray(post.content)) {
      post.content.forEach((tweet, i) => {
        console.log(`${i + 1}/${post.content.length}: ${tweet}\n`);
      });
    } else {
      console.log(post.content);
    }
    console.log('\n---\n');
  }

  // Output as JSON for easy import
  console.log('\n--- JSON OUTPUT (copy for queue import) ---\n');
  console.log(JSON.stringify(posts, null, 2));
}

generateWeek().catch(console.error);
