import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const STATE_COOKIE_NAME = 'google_oauth_state'

function resolveBaseUrl(requestUrl: string, headers: Headers) {
  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = headers.get('host')

  if (forwardedProto && (forwardedHost || host)) {
    return `${forwardedProto}://${forwardedHost || host}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  return new URL(requestUrl).origin
}

function resolveRedirectUri(requestUrl: string, headers: Headers, configuredUri?: string) {
  const requestOrigin = resolveBaseUrl(requestUrl, headers)
  const fallbackUri = `${requestOrigin}/api/auth/google/callback`

  if (!configuredUri) {
    return fallbackUri
  }

  try {
    const parsed = new URL(configuredUri)
    const isMatchingOrigin = parsed.origin === new URL(requestOrigin).origin
    const isCallbackPath = parsed.pathname.replace(/\/+$/, '') === '/api/auth/google/callback'

    if (isMatchingOrigin && isCallbackPath) {
      return parsed.toString()
    }
  } catch {
    // fall back to the current request origin
  }

  return fallbackUri
}

function resolveAppUrl(requestUrl: string, headers: Headers, configuredUrl?: string, defaultPath = '/lists') {
  const requestOrigin = resolveBaseUrl(requestUrl, headers)
  const fallbackUrl = `${requestOrigin}${defaultPath.startsWith('/') ? defaultPath : `/${defaultPath}`}`

  if (!configuredUrl) {
    return fallbackUrl
  }

  try {
    const parsed = new URL(configuredUrl)
    const isMatchingOrigin = parsed.origin === new URL(requestOrigin).origin

    if (isMatchingOrigin) {
      return parsed.toString()
    }
  } catch {
    // fall back to the current request origin
  }

  return fallbackUrl
}

async function fetchGoogleToken(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID!,
    client_secret: GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  return res.json()
}

async function fetchGoogleUserInfo(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return res.json()
}

export async function GET(req: Request) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    )
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const stateCookie = req.headers.get('cookie')?.split(';').find(cookie => cookie.trim().startsWith(`${STATE_COOKIE_NAME}=`))
  const storedState = stateCookie?.split('=')[1]

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.json({ error: 'Invalid OAuth state or missing code' }, { status: 400 })
  }

  const redirectUri = resolveRedirectUri(req.url, req.headers, GOOGLE_REDIRECT_URI)
  const tokenResponse = await fetchGoogleToken(code, redirectUri)

  if (!tokenResponse.access_token) {
    console.error('Google token response error', tokenResponse)
    return NextResponse.json({ error: 'Failed to exchange authorization code for token' }, { status: 500 })
  }

  const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token)

  if (!userInfo?.email) {
    console.error('Google user info error', userInfo)
    return NextResponse.json({ error: 'Failed to fetch Google user info' }, { status: 500 })
  }

  const email = userInfo.email as string
  const username = userInfo.name || email.split('@')[0]

  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: '',
      },
    })
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const successRedirectUrl = resolveAppUrl(req.url, req.headers, process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT, '/lists')
  const redirectUrl = new URL(successRedirectUrl)
  redirectUrl.searchParams.set('token', token)
  redirectUrl.searchParams.set('username', user.username || username)

  const response = NextResponse.redirect(redirectUrl.toString())
  response.cookies.delete(STATE_COOKIE_NAME)

  return response
}
