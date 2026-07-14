import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL
const STATE_COOKIE_NAME = 'google_oauth_state'

export async function GET(req: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    )
  }

  const origin = new URL(req.url).origin
  const redirectUri = GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`

  const state = randomBytes(16).toString('hex')
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'select_account')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/google/callback',
    maxAge: 300,
  })

  return response
}
