import { createDirectServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createDirectServiceClient()

  const { data, error } = await supabase
    .from('proposals')
    .select('html_content, status')
    .eq('slug', slug)
    .single()

  if (error || !data?.html_content) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(data.html_content, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
