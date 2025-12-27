// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 1. Cek User Session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Proteksi Halaman (Redirect Logic)
  const path = request.nextUrl.pathname

  // Jika belum login & coba akses halaman admin/staff
  if (!user && (path.startsWith('/admin') || path.startsWith('/staff'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Jika sudah login, cek role & arahkan
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const userRole = profile?.role

    // Proteksi Admin
    if (path.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/staff/input', request.url))
    }
    
    // Redirect dari Login Page jika sudah login
    if (path === '/login') {
      if (userRole === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (userRole === 'staff') return NextResponse.redirect(new URL('/staff/input', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/login'],
}