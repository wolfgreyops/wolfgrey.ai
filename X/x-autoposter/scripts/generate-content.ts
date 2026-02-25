/**
 * Generate a week of content using Claude API
 * Integrates wolfgrey-x-content and wolfgrey-brand skills
 * Usage: npm run generate
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic();

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
const X_CONTENT_SKILL = loadSkill('wolfgrey-x-content');

const CONTENT_PILLARS = [
  { day: 'Monday', theme: 'ROI/Results', description: 'Case study with specific numbers showing real time/money saved' },
  { day: 'Tuesday', theme: 'Tactical Tip', description: 'CRAFT prompt trick or Claude technique, specific and actionable' },
  { day: 'Wednesday', theme: 'Mindset Shift', description: 'Hot take or industry observation, contrarian view on AI adoption' },
  { day: 'Thursday', theme: 'Tool/Workflow', description: 'Step-by-step workflow walkthrough with clear before/after' },
  { day: 'Friday', theme: 'Thread', description: 'Deep-dive educational thread (5-7 tweets) on a single topic' },
  { day: 'Saturday', theme: 'Community', description: 'Engagement question or poll that sparks conversation' },
  { day: 'Sunday', theme: 'Soft Sell', description: 'Direct CTA to free guide with clear value proposition' },
];

const SYSTEM_PROMPT = `You are the content engine for wolfgrey.ai, creating X (Twitter) posts.

${BRAND_SKILL}

${X_CONTENT_SKILL}

CRITICAL RULES:
1. Single tweets MUST be under 280 characters
2. Threads should have 5-7 tweets, each under 280 characters
3. Hook in the first line - stop the scroll
4. One idea per tweet - don't cram
5. Use line breaks liberally for readability
6. End with clear CTA
7. NO hashtags
8. Minimal emojis (one max per tweet, if any)
9. Be specific - use real numbers, not vague claims
10. Write like you're talking to a smart business owner`;

async function generateWeek() {
  console.log('Loading wolfgrey skills...');
  console.log(`  - Brand skill: ${BRAND_SKILL ? 'loaded' : 'not found'}`);
  console.log(`  - X Content skill: ${X_CONTENT_SKILL ? 'loaded' : 'not found'}`);
  console.log('\nGenerating 7 days of content...\n');

  const posts: Array<{
    day: string;
    theme: string;
    type: 'single' | 'thread';
    content: string | string[];
  }> = [];

  for (const pillar of CONTENT_PILLARS) {
    const isThread = pillar.theme === 'Thread';

    const prompt = isThread
      ? `Generate a Twitter thread for ${pillar.day}.
Theme: ${pillar.theme}
Description: ${pillar.description}

Follow the thread format from the skill:
- Tweet 1: Hook + promise
- Tweets 2-5: One valuable insight per tweet, specific and actionable
- Tweet 6: Summary or key takeaway
- Tweet 7: CTA to wolfgrey.ai/guide?src=twitter and follow @__wolfgrey__

Return ONLY a JSON array of tweet strings. Each tweet under 280 characters.
Example format: ["Tweet 1 text", "Tweet 2 text", ...]`
      : `Generate a single tweet for ${pillar.day}.
Theme: ${pillar.theme}
Description: ${pillar.description}

Follow the single tweet format:
- Hook in first line
- Insight or solution
- CTA or takeaway

Return ONLY the tweet text. MUST be under 280 characters.`;

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
        const charCount = tweet.length;
        const status = charCount > 280 ? ' ⚠️ OVER LIMIT' : '';
        console.log(`${i + 1}/${post.content.length} (${charCount} chars${status}): ${tweet}\n`);
      });
    } else {
      const charCount = typeof post.content === 'string' ? post.content.length : 0;
      const status = charCount > 280 ? ' ⚠️ OVER LIMIT' : '';
      console.log(`(${charCount} chars${status}): ${post.content}`);
    }
    console.log('\n---\n');
  }

  // Output as JSON for easy import
  console.log('\n--- JSON OUTPUT (copy for queue import) ---\n');
  console.log(JSON.stringify(posts, null, 2));
}

generateWeek().catch(console.error);
