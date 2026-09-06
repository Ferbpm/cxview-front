const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL?.replace(/\/$/, '') ?? ''
const AUTH_MOCK_ENABLED = import.meta.env.VITE_AUTH_MOCK_ENABLED !== 'false'
const OTP_CHALLENGE_KEY = 'cxview.otp.challenge'

export interface OtpChallenge {
  challengeId: string
  maskedDestination: string
}

interface LoginPayload {
  username: string
  password: string
  remember: boolean
}

function maskDestination(username: string) {
  if (!username.includes('@')) return `${username.slice(0, 2)}${'•'.repeat(Math.max(3, username.length - 2))}`
  const [name, domain] = username.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(3, name.length - 2))}@${domain}`
}

async function mockPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, 450))

  if (path === '/auth/login') {
    const { username } = body as LoginPayload
    return {
      challengeId: crypto.randomUUID(),
      maskedDestination: maskDestination(username),
    } as TResponse
  }

  return undefined as TResponse
}

async function post<TResponse>(path: string, body: unknown): Promise<TResponse> {
  if (AUTH_MOCK_ENABLED) return mockPost<TResponse>(path, body)

  const response = await fetch(`${API_GATEWAY_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Las credenciales no son válidas.' : 'No pudimos completar la solicitud. Inténtalo nuevamente.')
  }

  if (response.status === 204) return undefined as TResponse
  return response.json() as Promise<TResponse>
}

export const authService = {
  async login(payload: LoginPayload) {
    const challenge = await post<OtpChallenge>('/auth/login', payload)
    sessionStorage.setItem(OTP_CHALLENGE_KEY, JSON.stringify(challenge))
    return challenge
  },

  getOtpChallenge(): OtpChallenge | null {
    const value = sessionStorage.getItem(OTP_CHALLENGE_KEY)
    if (!value) return null

    try {
      const challenge = JSON.parse(value) as OtpChallenge
      return challenge.challengeId && challenge.maskedDestination ? challenge : null
    } catch {
      sessionStorage.removeItem(OTP_CHALLENGE_KEY)
      return null
    }
  },

  verifyOtp(challengeId: string, code: string) {
    return post<void>('/auth/otp/verify', { challengeId, code })
  },

  resendOtp(challengeId: string) {
    return post<void>('/auth/otp/resend', { challengeId })
  },

  clearOtpChallenge() {
    sessionStorage.removeItem(OTP_CHALLENGE_KEY)
  },
}
