import { createDirectServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const maxDuration = 60

const ALLOWED_ORIGINS = ['https://wolfgrey.ai', 'https://www.wolfgrey.ai', 'https://proposals.wolfgrey.ai']
const NOTIFY_EMAIL = 'hey@wolfgrey.ai'
const PROPOSAL_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://wolfgrey.ai'

// Reference proposal for Claude to match style/structure
const REFERENCE_PROPOSAL = {
  problem_text:
    "Glenn is spending 5+ hours a day on lead gen tasks that follow the same pattern every time. Morgan is repeating himself across teams and manually tracking orders in spreadsheets. Leads go cold between steps because follow-up is manual, and nothing talks to anything else.",
  phases: [
    {
      name: 'Phase 1',
      title: 'Lead Engine',
      description:
        "Glenn's 5-hour daily grind of sourcing leads, writing cold emails, and managing outreach manually across UpLead, LinkedIn, and Mailchimp.",
      items: [
        'Automated lead enrichment pipeline — new UpLead contacts get formatted, scored, and pushed into your CRM with zero manual entry',
        'AI-assisted cold email drafts generated from prospect data — Glenn reviews and sends, not writes from scratch',
        'LinkedIn post scheduling system with a content template library',
        'Mailchimp campaign triggers tied to CRM stages so follow-up emails fire automatically',
      ],
      time_saved: '~3 hours/day saved for Glenn',
      setup_price_cents: 225000,
    },
  ],
  comparison: [
    {
      label: "Glenn's lead gen",
      before: '5 hrs/day manual',
      after: '~2 hrs/day reviewing + refining',
    },
  ],
  retainer_price_cents: 150000,
  retainer_description:
    'Monitoring, optimization, up to 2 new automation builds per month, and priority support.',
}

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

const SYSTEM_PROMPT = `You are a proposal generator for wolfgrey.ai, an AI automation consultancy for small businesses.

Given a prospect's survey responses, generate a structured proposal JSON object. Match the tone and style of this reference proposal:

${JSON.stringify(REFERENCE_PROPOSAL, null, 2)}

Rules:
- problem_text: 2-3 sentences synthesizing their pain points. Direct, specific to their answers. No jargon.
- phases: 2-4 phases. Each phase should solve a specific cluster of problems from the survey.
  - name: "Phase 1", "Phase 2", etc.
  - title: Short, punchy name (e.g., "Lead Engine", "Pipeline Autopilot", "Operations Layer")
  - description: One sentence describing the pain this phase solves, written about the prospect
  - items: 3-5 specific automation deliverables as bullet strings. Use em dashes. Be concrete.
  - time_saved: Realistic estimate like "~3 hours/day saved" or "~5 hours/week saved"
  - setup_price_cents: Integer. Phase 1 typically 150000-250000, later phases 100000-200000. Base on complexity.
- comparison: 4-6 rows showing before/after impact. Each has label, before, after.
- retainer_price_cents: Integer, typically 100000-150000 (monthly ongoing support)
- retainer_description: One sentence describing what the retainer covers.

Respond with ONLY valid JSON. No markdown fences. No explanation.`

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

    // Extract contact info
    const contactName = String(data.contact_name || data['contact_name'] || 'Unknown')
    const contactEmail = String(data.contact_email || data['contact_email'] || '')
    const company = extractCompanyFromEmail(contactEmail)

    // Format survey answers for Claude
    const surveyText = formatSurveyForPrompt(data)

    if (!surveyText.trim()) {
      return NextResponse.json(
        { error: 'No survey data received' },
        { status: 400, headers }
      )
    }

    // Generate proposal with Claude
    const anthropic = new Anthropic()

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a proposal for this prospect:\n\n${surveyText}`,
        },
      ],
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown fences if present
    const cleanJson = responseText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()

    let proposal: {
      problem_text: string
      phases: Array<{
        name: string
        title: string
        description: string
        items: string[]
        time_saved: string
        setup_price_cents: number
      }>
      comparison: Array<{ label: string; before: string; after: string }>
      retainer_price_cents: number
      retainer_description: string
    }

    try {
      proposal = JSON.parse(cleanJson)
    } catch {
      console.error('Failed to parse Claude response:', cleanJson)
      return NextResponse.json(
        { error: 'Failed to generate proposal structure' },
        { status: 500, headers }
      )
    }

    // Generate slug and insert into Supabase
    const slug = generateSlug(contactName)
    const supabase = createDirectServiceClient()

    const { error: insertError } = await supabase.from('proposals').insert({
      slug,
      client_name: contactName,
      client_company: company,
      client_website: company ? `${contactEmail.split('@')[1]}` : null,
      prepared_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      problem_text: proposal.problem_text,
      phases: proposal.phases,
      comparison: proposal.comparison,
      retainer_price_cents: proposal.retainer_price_cents,
      retainer_description: proposal.retainer_description,
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

    // Send notification email via Resend
    const proposalUrl = `${PROPOSAL_BASE_URL}/proposals/${slug}`

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const totalSetup = proposal.phases.reduce(
        (sum, p) => sum + p.setup_price_cents,
        0
      )

      await resend.emails.send({
        from: 'wolfgrey proposals <proposals@wolfgrey.ai>',
        to: NOTIFY_EMAIL,
        subject: `Draft proposal ready: ${contactName}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">New Proposal Draft</p>
            <h2 style="font-size: 24px; font-weight: 400; margin-bottom: 8px;">${contactName}</h2>
            ${company ? `<p style="color: #666; margin-bottom: 24px;">${company} &middot; ${contactEmail}</p>` : `<p style="color: #666; margin-bottom: 24px;">${contactEmail}</p>`}
            <p style="color: #333; line-height: 1.6; margin-bottom: 24px;">${proposal.problem_text}</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
              ${proposal.phases.length} phases &middot; $${(totalSetup / 100).toLocaleString()} setup &middot; $${(proposal.retainer_price_cents / 100).toLocaleString()}/mo retainer
            </p>
            <a href="${proposalUrl}" style="display: inline-block; background: #ff4d4d; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Review Proposal</a>
            <p style="color: #999; font-size: 13px; margin-top: 32px;">This proposal is in <strong>draft</strong> status. The prospect cannot see it yet.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      // Log but don't fail the webhook — the proposal is saved
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
