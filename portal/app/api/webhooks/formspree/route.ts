import { createDirectServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const maxDuration = 60

const ALLOWED_ORIGINS = ['https://wolfgrey.ai', 'https://www.wolfgrey.ai', 'https://proposals.wolfgrey.ai']
const NOTIFY_EMAIL = 'hey@wolfgrey.ai'
const PROPOSAL_BASE_URL = 'https://proposals.wolfgrey.ai'

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

function extractCompanyFromEmail(email: string): string | null {
  if (!email) return null
  const domain = email.split('@')[1]
  if (!domain) return null
  const freeProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'protonmail.com', 'mail.com',
  ]
  if (freeProviders.includes(domain.toLowerCase())) return null
  return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
}

function formatSurveyForPrompt(data: Record<string, unknown>): string {
  const fields = [
    ['Contact Name', data.contact_name || data['contact_name']],
    ['Contact Email', data.contact_email || data['contact_email']],
    ['Q1 - Recurring Tasks & Time', data.q1_recurring_tasks],
    ['Q2 - Time Drains', formatArray(data['q2_time_drains[]'] || data.q2_time_drains)],
    ['Q2 - Other', data.q2_time_drains_other],
    ['Q3 - Tools Used', data.q3_tools],
    ['Q4 - Falls Through Cracks', formatArray(data['q4_cracks[]'] || data.q4_cracks)],
    ['Q4 - Other', data.q4_cracks_other],
    ['Q5 - Lead-to-Customer Process', data.q5_lead_process],
    ['Q6 - Workflow Maturity', data.q6_workflow],
    ['Q7 - Typical Week', data.q7_typical_week],
    ['Q8 - Reinventing the Wheel', data.q8_reinventing_wheel],
    ['Q9 - One Task to Eliminate', data.q9_eliminate_task],
    ['Q10 - Success Criteria', formatArray(data['q10_success[]'] || data.q10_success)],
    ['Q10 - Hours to Save', data.q10_hours_detail],
    ['Q10 - Other', data.q10_success_other],
  ]

  return fields
    .filter(([, v]) => v)
    .map(([label, value]) => `**${label}:** ${value}`)
    .join('\n')
}

function formatArray(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string') return val
  return ''
}

// The Gobi proposal HTML serves as the template reference
const SYSTEM_PROMPT = `You are a proposal generator for wolfgrey.ai, an AI automation consultancy for small businesses.

Given a prospect's survey responses, generate a COMPLETE, self-contained HTML page for an automation proposal. The HTML must be a single file with all CSS inline in a <style> tag. No external dependencies except Google Fonts.

Use this exact design system:
- Fonts: DM Sans (body), Source Serif 4 (headings) via Google Fonts
- Colors: --black: #111111, --red: #ff4d4d (CTAs, section labels), --teal: #00c9b0 (accents, time-saved badges, list bullets), --gray-600: #555555 (body text), --gray-400: #999999, --gray-200: #e0e0e0 (borders), --gray-100: #f4f4f4 (card backgrounds), --white: #ffffff
- Layout: max-width 720px, centered, 60px padding
- Section labels: 11px uppercase, red, letter-spacing 0.1em
- Headings: Source Serif 4, font-weight 300, letter-spacing -0.02em
- Body text: 15px, color #555555, line-height 1.7
- Phase cards: background #f4f4f4, border-radius 12px, 32px padding, 3px left border in red
- Phase bullets: teal dot before each item
- Time saved badge: white background, 1px border #e0e0e0, teal text, 6px 14px padding, border-radius 6px
- Pricing table: clean, minimal, 3 columns (blank, SETUP, MONTHLY as uppercase gray headers). Each phase row shows setup cost and em dash for monthly. "Ongoing Retainer" row shows em dash for setup and "$X,XXX/mo" for monthly. Total row has 2px top border in red and bold text. Below the table include two notes: "Setup includes: Architecture, build, testing, data migration, and training across all phases. Delivered in 3-4 weeks." and "Retainer includes: Monitoring, optimization, up to 2 new automation builds per month, and priority support." — both with bold labels
- Comparison table: 3 columns (label, Before in gray, After in black)
- CTA: red button (#ff4d4d), white text, 14px 36px padding, border-radius 8px, links to https://cal.com/wolfgrey/ai-kickoff
- Dividers: 1px solid #e0e0e0, 48px margin
- Header: logo (img src="https://wolfgrey.ai/logo.png") + "wolfgrey.ai" left, "Automation Proposal" + date right
- Footer: centered, small logo + "wolfgrey.ai — AI systems that run small businesses."

Structure:
1. Header with wolfgrey.ai branding and date
2. "Prepared for" section with client name and company
3. "The Problem" section — 2-3 sentences synthesizing their pain points
4. Divider
5. Phase cards (2-4 phases), each with: phase number label, title, description, bullet items, time saved badge
6. Divider
7. Pricing table with setup costs per phase + monthly retainer row + total
8. Divider
9. "What Changes" before/after comparison table (4-6 rows)
10. Divider
11. CTA section: "Next Step" heading, short paragraph, red "Book a Call" button
12. Footer

Critical rules:
- NEVER drop or ignore anything the prospect explicitly mentioned in their survey. If they said they want help with social media, newsletters, landing pages, pipelines, or any specific task — it MUST appear as a deliverable in one of the phases. Every stated need gets addressed.
- Read the Q10 "success/other" and Q1 fields especially carefully — these contain the prospect's own words about what they want. Include ALL of them.

Pricing guidelines:
- Phase setup: $1,500-$2,500 each depending on complexity
- Monthly retainer: always $2,500/mo
- Format prices as "$X,XXX" in the HTML

Generate the COMPLETE HTML. Start with <!DOCTYPE html> and end with </html>. Nothing else.`

function corsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  try {
    const data = await req.json()

    const contactName = String(data.contact_name || data['contact_name'] || 'Unknown')
    const contactEmail = String(data.contact_email || data['contact_email'] || '')
    const company = extractCompanyFromEmail(contactEmail)

    const surveyText = formatSurveyForPrompt(data)

    if (!surveyText.trim()) {
      return NextResponse.json(
        { error: 'No survey data received' },
        { status: 400, headers }
      )
    }

    // Generate proposal HTML and internal action plan in parallel
    const anthropic = new Anthropic()

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    const userPrompt = `Generate a proposal for:\nClient: ${contactName}\nCompany: ${company || 'N/A'}\nDate: ${today}\n\nSurvey responses:\n${surveyText}`

    const [message, planMessage] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: `You are an internal ops planner for wolfgrey.ai, an AI automation consultancy. Given a prospect's survey responses, write a concise internal action plan — what wolfgrey needs to do if this proposal is approved.

Format as HTML for an email. Keep it practical and specific to this client. Include:
- Tools to set up or integrate (based on what they use)
- Specific automations to build per phase
- Data migrations or imports needed
- Training/handoff items
- Timeline estimates per phase
- Any risks or dependencies to flag

Use simple HTML: <h3> for section headers, <ul><li> for items. No wrapper div. No CSS. Keep it under 20 bullet points total.`,
        messages: [{ role: 'user', content: `Survey data:\n${surveyText}` }],
      }),
    ])

    const htmlContent =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const actionPlan =
      planMessage.content[0].type === 'text' ? planMessage.content[0].text : ''

    if (!htmlContent.includes('<!DOCTYPE html>')) {
      console.error('Claude did not return valid HTML')
      return NextResponse.json(
        { error: 'Failed to generate proposal' },
        { status: 500, headers }
      )
    }

    // Store in Supabase
    const slug = generateSlug(contactName)
    const supabase = createDirectServiceClient()

    const { error: insertError } = await supabase.from('proposals').insert({
      slug,
      client_name: contactName,
      client_company: company,
      client_website: company ? contactEmail.split('@')[1] : null,
      prepared_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      problem_text: '',
      phases: [],
      comparison: [],
      retainer_price_cents: 0,
      html_content: htmlContent,
      cta_url: 'https://cal.com/wolfgrey/ai-kickoff',
      cta_text: 'Book a Call',
    })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save proposal' },
        { status: 500, headers }
      )
    }

    // Send notification email with action plan
    const proposalUrl = `${PROPOSAL_BASE_URL}/api/proposals/${slug}`

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'wolfgrey proposals <proposals@mail.wolfgrey.ai>',
        to: NOTIFY_EMAIL,
        subject: `Draft proposal ready: ${contactName}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">New Proposal Draft</p>
            <h2 style="font-size: 24px; font-weight: 400; margin-bottom: 8px;">${contactName}</h2>
            ${company ? `<p style="color: #666; margin-bottom: 24px;">${company} &middot; ${contactEmail}</p>` : `<p style="color: #666; margin-bottom: 24px;">${contactEmail}</p>`}
            <a href="${proposalUrl}" style="display: inline-block; background: #ff4d4d; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">Review Proposal</a>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Internal Action Plan</p>
            <div style="font-size: 14px; color: #333; line-height: 1.7;">
              ${actionPlan}
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
            <p style="color: #999; font-size: 13px;">This proposal is in <strong>draft</strong> status. The prospect cannot see it until you share the link.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr)
    }

    return NextResponse.json({ success: true, slug, url: proposalUrl }, { headers })
  } catch (err) {
    console.error('Survey webhook error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(null) }
    )
  }
}
