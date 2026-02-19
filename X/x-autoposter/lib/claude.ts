import Anthropic from '@anthropic-ai/sdk';
import { QueuedPost } from './content-queue';

// Lazy initialization to avoid build-time errors
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const CONTENT_PILLARS = [
  { day: 'Monday', theme: 'ROI/Results', description: 'Case study with specific numbers, time saved, client wins' },
  { day: 'Tuesday', theme: 'Tactical Tip', description: 'CRAFT prompt trick, Claude technique, actionable how-to' },
  { day: 'Wednesday', theme: 'Mindset Shift', description: 'Hot take, industry observation, contrarian view' },
  { day: 'Thursday', theme: 'Tool/Workflow', description: 'Specific workflow, before/after, tool promotion' },
  { day: 'Friday', theme: 'Thread', description: 'Deep-dive educational thread, 5-7 tweets, maximum value' },
  { day: 'Saturday', theme: 'Community', description: 'Engagement question, poll, conversation starter' },
  { day: 'Sunday', theme: 'Soft Sell', description: 'Direct CTA to free guide or tools' },
];

const SYSTEM_PROMPT = `You are the content engine for wolfgrey.ai, creating X (Twitter) posts.

BRAND VOICE:
- Direct, operator-to-operator tone
- Results-first, no fluff
- Specific numbers over vague claims
- Never use: "revolutionary", "game-changing", "unlock the power", "dive in", "let's explore"
- Write like a busy operator sharing what actually works

PRODUCTS TO PROMOTE:
- Free AI Quick-Start Guide: wolfgrey.ai/guide?src=twitter
- Free Tools (ROI Calculator, AI Quiz, Prompt Generator): wolfgrey.ai/tools?src=twitter
- $49 Small Business AI Playbook: wolfgrey.ai/playbook?src=twitter
- $199 Claude Mastery Series: wolfgrey.ai/mastery?src=twitter

CRAFT FRAMEWORK (reference when relevant):
- C = Context (who you are, what you're working on)
- R = Role (expert identity for Claude)
- A = Action (specific task)
- F = Format (output structure)
- T = Tone (voice and style)

RULES:
- Single tweets must be under 280 characters
- Thread tweets should each be under 280 characters
- Include UTM links where appropriate
- Be specific (real numbers, real workflows)
- Every post should provide value or provoke thought
- Mix educational content with soft CTAs`;

export async function generateWeeklyContent(
  startDate: Date = new Date()
): Promise<Omit<QueuedPost, 'id' | 'status'>[]> {
  const posts: Omit<QueuedPost, 'id' | 'status'>[] = [];

  for (let i = 0; i < 7; i++) {
    const postDate = new Date(startDate);
    postDate.setDate(postDate.getDate() + i);
    const dayOfWeek = postDate.toLocaleDateString('en-US', { weekday: 'long' });
    const pillar = CONTENT_PILLARS.find(p => p.day === dayOfWeek) || CONTENT_PILLARS[0];

    const isThread = pillar.theme === 'Thread';

    const prompt = isThread
      ? `Generate a Twitter thread (5-7 tweets) for ${dayOfWeek}.
Theme: ${pillar.theme}
Description: ${pillar.description}

Return ONLY a JSON array of strings, each string being one tweet in the thread.
Example: ["Tweet 1 content", "Tweet 2 content", "Tweet 3 content"]

The last tweet should include a CTA with a link to wolfgrey.ai/guide?src=twitter or wolfgrey.ai/playbook?src=twitter`
      : `Generate a single tweet for ${dayOfWeek}.
Theme: ${pillar.theme}
Description: ${pillar.description}

Return ONLY the tweet text, nothing else. Under 280 characters.
${pillar.theme === 'Soft Sell' ? 'Include a link to wolfgrey.ai/guide?src=twitter or wolfgrey.ai/tools?src=twitter' : ''}`;

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') continue;

    // Set posting time based on day (12pm EST = 17:00 UTC)
    const scheduledDate = new Date(postDate);
    scheduledDate.setUTCHours(17, 0, 0, 0);

    if (isThread) {
      try {
        const tweets = JSON.parse(content.text);
        posts.push({
          type: 'thread',
          content: tweets,
          scheduledFor: scheduledDate.toISOString(),
          theme: pillar.theme,
        });
      } catch {
        // If JSON parsing fails, treat as single tweet
        posts.push({
          type: 'single',
          content: content.text.slice(0, 280),
          scheduledFor: scheduledDate.toISOString(),
          theme: pillar.theme,
        });
      }
    } else {
      posts.push({
        type: 'single',
        content: content.text.slice(0, 280),
        scheduledFor: scheduledDate.toISOString(),
        theme: pillar.theme,
      });
    }
  }

  return posts;
}

export async function generateSinglePost(
  theme: string,
  customPrompt?: string
): Promise<string> {
  const prompt = customPrompt || `Generate a single tweet about: ${theme}. Under 280 characters.`;

  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('No text response');

  return content.text.slice(0, 280);
}
