/**
 * Generate WOLF engagement posts for auto-DM campaigns
 * Integrates wolfgrey-x-content skill
 * Usage: npm run engagement
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

const ENGAGEMENT_TOPICS = [
  { topic: 'Prompt Templates', deliverable: '12 copy-paste prompt templates for business tasks' },
  { topic: 'Email Automation', deliverable: 'Email automation workflow guide' },
  { topic: 'Claude Tips', deliverable: '10 Claude tips most users don\'t know' },
  { topic: 'Time Tracking', deliverable: 'AI time audit template to find your 10 wasted hours' },
  { topic: 'SOPs', deliverable: 'SOP template that trains AI on your processes' },
  { topic: 'Sales Prompts', deliverable: '7 sales prompts that actually convert' },
];

const SYSTEM_PROMPT = `You are creating WOLF engagement posts for wolfgrey.ai's X account.

${BRAND_SKILL}

${X_CONTENT_SKILL}

WOLF ENGAGEMENT POST FORMAT:
These posts offer valuable free content in exchange for engagement (follow + retweet + reply "WOLF").
An auto-DM system sends the resource when users reply with "WOLF".

STRUCTURE:
1. Hook with credibility or value statement
2. What they'll get (be specific)
3. Clear instructions:
   - Follow @__wolfgrey__
   - Retweet this post
   - Reply "WOLF"
4. What happens next (DM sent automatically)

RULES:
1. The keyword is ALWAYS "WOLF" - never change it
2. Be specific about what they'll receive
3. Lead with value/credibility, not the ask
4. Mention auto-DM so they know it's instant
5. Keep under 280 characters if possible, or use a short thread (2-3 tweets)
6. No hashtags`;

async function generateEngagementPosts(count: number = 4) {
  console.log('Loading wolfgrey skills...');
  console.log(`  - Brand skill: ${BRAND_SKILL ? 'loaded' : 'not found'}`);
  console.log(`  - X Content skill: ${X_CONTENT_SKILL ? 'loaded' : 'not found'}`);
  console.log(`\nGenerating ${count} WOLF engagement posts...\n`);

  const selectedTopics = ENGAGEMENT_TOPICS
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  const posts: Array<{
    topic: string;
    content: string;
  }> = [];

  for (const { topic, deliverable } of selectedTopics) {
    process.stdout.write(`${topic}... `);

    const prompt = `Create a WOLF engagement post about: ${topic}
Deliverable they'll receive: ${deliverable}

The post should:
1. Hook with a credibility statement or bold claim about ${topic}
2. Describe what they'll get: ${deliverable}
3. Include the engagement instructions (follow, RT, reply WOLF)
4. Mention the auto-DM

Return ONLY the tweet text. Can be a single tweet or 2-3 tweet thread (return as JSON array if thread).`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') continue;

    posts.push({ topic, content: content.text });
    console.log('Done');
  }

  console.log('\n--- GENERATED WOLF POSTS ---\n');

  for (const post of posts) {
    console.log(`## ${post.topic}\n`);

    // Check if it's a JSON array (thread) or single tweet
    try {
      const parsed = JSON.parse(post.content);
      if (Array.isArray(parsed)) {
        parsed.forEach((tweet, i) => {
          console.log(`${i + 1}/${parsed.length}: ${tweet}\n`);
        });
      } else {
        console.log(post.content);
      }
    } catch {
      console.log(post.content);
    }

    console.log('\n---\n');
  }

  // Output as JSON
  console.log('\n--- JSON OUTPUT ---\n');
  console.log(JSON.stringify(posts, null, 2));
}

// Get count from command line args
const count = parseInt(process.argv[2]) || 4;
generateEngagementPosts(count).catch(console.error);
