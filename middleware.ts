import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PAGE_MAP: Record<string, string> = {
  home: '/',
  staff: '/staff',
  plan: '/',
  book: '/book',
  booking: '/book',
  gallery: '/gallery',
  faq: '/faq',
  blog: '/blog',
}

export function middleware(request: NextRequest) {
  const page = request.nextUrl.searchParams.get('page')

  if (page && PAGE_MAP[page]) {
    const url = request.nextUrl.clone()
    url.pathname = PAGE_MAP[page]
    url.searchParams.delete('page')
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: '/',
}
