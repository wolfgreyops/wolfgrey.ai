/**
 * Generate weekly newsletter from published X posts
 * Usage: npm run newsletter
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic();

const TYPEFULLY_API = 'https://api.typefully.com/v1';

interface PublishedPost {
  id: number;
  preview: string;
  published_at: string;
  x_published_url: string | null;
}

const NEWSLETTER_SYSTEM_PROMPT = `You are the newsletter editor for wolfgrey.ai.

Your job is to compile X posts from the past week into a cohesive newsletter.

BRAND VOICE:
- Direct, operator-to-operator tone
- Results-first, no fluff
- Conversational but professional
- Write like you're emailing a smart friend

NEWSLETTER STRUCTURE:
1. **Opening hook** - 1-2 sentences, what's the theme this week
2. **Main sections** (2-4) - Expand on the best posts, add context
3. **Quick hits** - Bullet points of other insights
4. **CTA** - Link to guides, tools, or consulting

RULES:
- Keep it under 600 words
- Add context/expansion to tweets (don't just copy them)
- Include links where relevant
- End with clear next step

OUTPUT FORMAT:
Return the newsletter in markdown format, ready to paste into Substack.`;

async function fetchRecentPosts(): Promise<PublishedPost[]> {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  if (!apiKey) {
    throw new Error('TYPEFULLY_API_KEY not configured');
  }

  // Fetch recently published drafts
  const response = await fetch(`${TYPEFULLY_API}/drafts/recently-published`, {
    headers: {
      'X-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Typefully API error: ${response.status}`);
  }

  const data = await response.json();

  // Filter to last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return data.filter((post: PublishedPost) => {
    const publishedDate = new Date(post.published_at);
    return publishedDate >= oneWeekAgo;
  });
}

async function generateNewsletter(posts: PublishedPost[]): Promise<string> {
  if (posts.length === 0) {
    throw new Error('No posts found from the past week');
  }

  const postsContent = posts.map((post, i) => {
    return `Post ${i + 1} (${new Date(post.published_at).toLocaleDateString()}):\n${post.preview}`;
  }).join('\n\n---\n\n');

  const prompt = `Here are the X posts from wolfgrey.ai this week:

${postsContent}

Compile these into a newsletter. Expand on the ideas, add context, and make it feel like a cohesive weekly update. Include a CTA to wolfgrey.ai/resources at the end.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: NEWSLETTER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return content.text;
}

async function saveNewsletter(content: string): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const filename = `${dateStr}-weekly-newsletter.md`;

  // Save to content/newsletters in the main ai directory
  const newsletterDir = path.join(__dirname, '../../../content/newsletters');

  if (!fs.existsSync(newsletterDir)) {
    fs.mkdirSync(newsletterDir, { recursive: true });
  }

  const filepath = path.join(newsletterDir, filename);

  const fullContent = `# Weekly Newsletter - ${date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })}

*Generated from this week's X posts*

---

${content}

---

*Copy this into Substack and publish!*
`;

  fs.writeFileSync(filepath, fullContent);
  return filepath;
}

async function main() {
  console.log('Fetching recent posts from Typefully...\n');

  try {
    const posts = await fetchRecentPosts();
    console.log(`Found ${posts.length} posts from the past week\n`);

    if (posts.length === 0) {
      console.log('No posts to compile. Exiting.');
      return;
    }

    console.log('Generating newsletter with Claude...\n');
    const newsletter = await generateNewsletter(posts);

    console.log('--- NEWSLETTER PREVIEW ---\n');
    console.log(newsletter);
    console.log('\n--- END PREVIEW ---\n');

    const filepath = await saveNewsletter(newsletter);
    console.log(`\nNewsletter saved to: ${filepath}`);
    console.log('\nCopy the content into Substack and publish!');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
