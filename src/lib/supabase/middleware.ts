import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('USER:', user)
  const { pathname } = request.nextUrl

  const authPages = ['/login', '/forgot-password', '/reset-password']
  const isAuthPage = authPages.some(p => pathname === p || pathname.startsWith(p + '/'))

  const isPatientRoute = pathname.startsWith('/patient')
  const isDoctorRoute = pathname.startsWith('/doctor')
  const isNurseRoute = pathname.startsWith('/nurse')
  const isProtectedPortalRoute = isPatientRoute || isDoctorRoute || isNurseRoute

  // If user is not authenticated and trying to access a protected route
  if (!user) {
    if (isProtectedPortalRoute || pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      if (isProtectedPortalRoute) {
        url.searchParams.set('redirectTo', pathname)
      }
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // If user is authenticated, we need to fetch their role
  let role: string | null = null
  try {
    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile && user.email) {
      const { data: fallbackProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', user.email)
        .single()
      profile = fallbackProfile
    }

    role = profile?.role || null
  } catch (err) {
    console.error('Error fetching role in middleware:', err)
  }

  // If role is not found, we should assume unauthorized or redirect to login
  if (user && !role) {
    if (pathname !== '/unauthorized' && !isAuthPage && pathname !== '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Define portal paths based on role
  const rolePortals: Record<string, string> = {
    PATIENT: '/patient',
    DOCTOR: '/doctor',
    NURSE: '/nurse',
  }

  console.log('ROLE:', role)

  const userPortal = role ? rolePortals[role.toUpperCase()] : null

  // If authenticated user visits login/auth pages, redirect to their role portal
  if (isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = userPortal || '/unauthorized'
    return NextResponse.redirect(url)
  }

  // Route-based authorization checks
  if (isPatientRoute && role?.toUpperCase() !== 'PATIENT') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  if (isDoctorRoute && role?.toUpperCase() !== 'DOCTOR') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  if (isNurseRoute && role?.toUpperCase() !== 'NURSE') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

