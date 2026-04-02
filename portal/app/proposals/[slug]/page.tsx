import './proposals.css'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Phase = {
  name: string
  title: string
  description: string
  items: string[]
  time_saved: string
  setup_price_cents: number
}

type Comparison = {
  label: string
  before: string
  after: string
}

type Proposal = {
  id: string
  slug: string
  client_name: string
  client_company: string | null
  client_website: string | null
  prepared_date: string
  status: string
  problem_text: string
  phases: Phase[]
  retainer_price_cents: number
  retainer_description: string | null
  stripe_setup_payment_link: string | null
  stripe_retainer_payment_link: string | null
  comparison: Comparison[]
  cta_url: string
  cta_text: string
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Proposal | wolfgrey.ai`,
    description: `Automation proposal for ${slug}`,
  }
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // --- MOCK DATA (remove when Supabase is connected) ---
  const mockProposals: Record<string, Proposal> = {
    gobi: {
      id: '1',
      slug: 'gobi',
      client_name: 'Morgan & Glenn',
      client_company: 'Gobi',
      client_website: 'gobi.world',
      prepared_date: '2026-04-01',
      status: 'sent',
      problem_text:
        'Glenn is spending 5+ hours a day on lead gen tasks that follow the same pattern every time. Morgan is repeating himself across teams and manually tracking orders in spreadsheets. Leads go cold between steps because follow-up is manual, and nothing talks to anything else.',
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
        {
          name: 'Phase 2',
          title: 'Pipeline Autopilot',
          description:
            'Leads going cold after sample requests. No-shows on scheduling. The "then nothing happens" problem.',
          items: [
            'Automated follow-up sequences at every pipeline stage: post-contact, post-intro, post-sample, post-pricing',
            'Smart scheduling — prospects get a calendar link immediately, no email tag required',
            'Sample shipment tracking with automated check-ins timed to delivery windows',
            'CRM stage automation — leads move through stages based on actions, not manual updates',
          ],
          time_saved: '~1-2 hours/day saved for Glenn',
          setup_price_cents: 180000,
        },
        {
          name: 'Phase 3',
          title: 'Operations Layer',
          description:
            'Morgan repeating the same information to the team, order tracking in spreadsheets, documents scattered everywhere.',
          items: [
            'Centralized order/shipment/invoice tracker that syncs automatically',
            'Product collateral system — searchable library that auto-attaches the right files based on product and client',
            'Internal knowledge base — common answers written once and served on demand',
            'Project proposal templates with auto-populated client data',
          ],
          time_saved: '~1-2 hours/day saved for Morgan',
          setup_price_cents: 150000,
        },
      ],
      retainer_price_cents: 150000,
      retainer_description:
        'Monitoring, optimization, up to 2 new automation builds per month, and priority support.',
      stripe_setup_payment_link: null,
      stripe_retainer_payment_link: null,
      comparison: [
        {
          label: "Glenn's lead gen",
          before: '5 hrs/day manual',
          after: '~2 hrs/day reviewing + refining',
        },
        {
          label: 'Follow-up',
          before: 'Manual, inconsistent',
          after: 'Automated, timed, persistent',
        },
        {
          label: 'CRM updates',
          before: '1 hr/day data entry',
          after: 'Auto-synced',
        },
        {
          label: "Morgan's repeat answers",
          before: 'Multiple times/day',
          after: 'Answered once, served on demand',
        },
        {
          label: 'Order tracking',
          before: 'Manual spreadsheet',
          after: 'Live, auto-updated',
        },
        {
          label: 'Collateral delivery',
          before: 'Hunt and customize each time',
          after: 'Auto-matched and attached',
        },
      ],
      cta_url: 'https://cal.com/wolfgrey/ai-kickoff',
      cta_text: 'Book a Call',
    },
  }

  // Try mock data first, then Supabase
  let proposal: Proposal | null = mockProposals[slug] || null

  if (!proposal) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .eq('slug', slug)
        .single()

      proposal = data as Proposal | null
    } catch {
      // Supabase not connected yet
    }
  }

  if (!proposal) notFound()

  const totalSetupCents = proposal.phases.reduce(
    (sum, p) => sum + p.setup_price_cents,
    0
  )

  return (
    <div className="proposal-page">
      <div className="proposal-container">
        {/* Header */}
        <header className="proposal-header">
          <div className="header-brand">
            <img src="/logo.png" alt="wolfgrey" className="header-logo" />
            <span className="header-name">wolfgrey.ai</span>
          </div>
          <div className="header-meta">
            Automation Proposal
            <br />
            {formatDate(proposal.prepared_date)}
          </div>
        </header>

        {/* Prepared For */}
        <section className="prepared-for">
          <div className="label">Prepared for</div>
          <h1 className="client-name">{proposal.client_name}</h1>
          {proposal.client_website && (
            <div className="client-company">{proposal.client_website}</div>
          )}
        </section>

        {/* Problem */}
        <section className="section">
          <div className="section-label">The Problem</div>
          <p className="problem-text">{proposal.problem_text}</p>
          <p className="build-intro">
            <strong>Here&apos;s what we&apos;d build to fix that.</strong>
          </p>
        </section>

        <hr className="divider" />

        {/* Phases */}
        {proposal.phases.map((phase) => (
          <div key={phase.name} className="phase-card">
            <div className="phase-number">{phase.name}</div>
            <h3 className="phase-title">{phase.title}</h3>
            <p className="phase-description">{phase.description}</p>
            <ul className="phase-items">
              {phase.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <span className="time-saved">{phase.time_saved}</span>
          </div>
        ))}

        <hr className="divider" />

        {/* Pricing */}
        <section className="section">
          <div className="section-label">Investment</div>
          <h2 className="section-title">Pricing</h2>

          <table className="pricing-table">
            <thead>
              <tr>
                <th></th>
                <th>Setup</th>
                <th>Monthly</th>
              </tr>
            </thead>
            <tbody>
              {proposal.phases.map((phase) => (
                <tr key={phase.name}>
                  <td>
                    {phase.name}: {phase.title}
                  </td>
                  <td>{formatCents(phase.setup_price_cents)}</td>
                  <td>&mdash;</td>
                </tr>
              ))}
              <tr>
                <td>Ongoing Retainer</td>
                <td>&mdash;</td>
                <td>{formatCents(proposal.retainer_price_cents)}/mo</td>
              </tr>
              <tr className="total-row">
                <td>Total</td>
                <td>{formatCents(totalSetupCents)}</td>
                <td>{formatCents(proposal.retainer_price_cents)}/mo</td>
              </tr>
            </tbody>
          </table>

          <p className="pricing-note">
            <strong>Setup includes:</strong> Architecture, build, testing, data
            migration, and training across all phases. Delivered in 3–4 weeks.
            <br />
            <strong>Retainer includes:</strong>{' '}
            {proposal.retainer_description}
          </p>

          {/* Payment buttons */}
          {(proposal.stripe_setup_payment_link ||
            proposal.stripe_retainer_payment_link) && (
            <div className="payment-buttons">
              {proposal.stripe_setup_payment_link && (
                <a
                  href={proposal.stripe_setup_payment_link}
                  className="pay-button pay-setup"
                >
                  Pay Setup Fee — {formatCents(totalSetupCents)}
                </a>
              )}
              {proposal.stripe_retainer_payment_link && (
                <a
                  href={proposal.stripe_retainer_payment_link}
                  className="pay-button pay-retainer"
                >
                  Start Retainer —{' '}
                  {formatCents(proposal.retainer_price_cents)}/mo
                </a>
              )}
            </div>
          )}
        </section>

        <hr className="divider" />

        {/* Comparison */}
        {proposal.comparison.length > 0 && (
          <section className="section">
            <div className="section-label">Impact</div>
            <h2 className="section-title">What Changes</h2>

            <table className="comparison-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="col-before">Before</th>
                  <th className="col-after">After</th>
                </tr>
              </thead>
              <tbody>
                {proposal.comparison.map((row, i) => (
                  <tr key={i}>
                    <td className="comp-label">{row.label}</td>
                    <td className="comp-before">{row.before}</td>
                    <td className="comp-after">{row.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <hr className="divider" />

        {/* CTA */}
        <section className="cta-section">
          <h2>Next Step</h2>
          <p>
            Book a 30-minute build planning call. We&apos;ll map your current
            tools, confirm integrations, and lock in a start date.
          </p>
          <a href={proposal.cta_url} className="cta-button">
            {proposal.cta_text}
          </a>
          <span className="cta-alt">Or reply directly to this email.</span>
        </section>

        {/* Footer */}
        <footer className="proposal-footer">
          <img src="/logo.png" alt="wolfgrey" className="footer-logo" />
          <p>wolfgrey.ai — AI systems that run small businesses.</p>
        </footer>
      </div>
    </div>
  )
}
