/**
 * Generate weekly newsletter from published X posts
 * Integrates wolfgrey-newsletter and wolfgrey-brand skills
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

// Load skill content
function loadSkill(skillName: string): string {
  const skillPath = path.join(__dirname, `../../../skills/${skillName}/SKILL.md`);
  try {
    return fs.readFileSync(skillPath, 'utf-8');
  } catch {
    console.warn(`Warning: Could not load skill ${skillName}`);
    return '';
  }
}

const BRAND_SKILL = loadSkill('wolfgrey-brand');
const NEWSLETTER_SKILL = loadSkill('wolfgrey-newsletter');

const NEWSLETTER_SYSTEM_PROMPT = `You are the newsletter editor for wolfgrey.ai.

${BRAND_SKILL}

${NEWSLETTER_SKILL}

Your job is to compile X posts from the past week into a cohesive Substack newsletter.

CRITICAL RULES:
1. Follow the newsletter template structure exactly
2. Expand tweets into full sections - don't just copy them
3. Add context, examples, and the "why" behind each insight
4. Keep total length 500-800 words
5. Use the exact formatting (headers, bold, horizontal rules)
6. Always end with CTA to wolfgrey.ai/resources
7. Sign off with: *Built with Claude. Shipped by wolfgrey.*

OUTPUT FORMAT:
Return the newsletter in markdown format, ready to paste into Substack.
Start with the title: # The Weekly Build | [Date]`;

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

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const prompt = `Here are the X posts from wolfgrey.ai this week:

${postsContent}

Compile these into a newsletter for ${dateStr}.

Follow the newsletter skill template:
1. Title: # The Weekly Build | ${dateStr}
2. Teaser line with 2-3 topics
3. 2-4 main sections (expand the best posts with context)
4. Quick Hits section (bullet points of remaining insights)
5. "One Thing to Try This Week" section
6. CTA to wolfgrey.ai/resources
7. Sign-off: *Built with Claude. Shipped by wolfgrey.*

Remember to EXPAND on the tweets - add the "why", the "how", and concrete examples. Don't just copy the tweet text.`;

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

  // Save the raw newsletter content (already formatted)
  fs.writeFileSync(filepath, content);
  return filepath;
}

async function main() {
  console.log('Loading wolfgrey skills...');
  console.log(`  - Brand skill: ${BRAND_SKILL ? 'loaded' : 'not found'}`);
  console.log(`  - Newsletter skill: ${NEWSLETTER_SKILL ? 'loaded' : 'not found'}`);
  console.log('\nFetching recent posts from Typefully...\n');

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
    console.log(`Newsletter saved to: ${filepath}`);
    console.log('\nCopy the content into Substack and publish!');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
