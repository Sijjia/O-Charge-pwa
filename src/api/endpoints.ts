/**
 * API Endpoints - Unified endpoint definitions
 * All paths are relative to the API base URL
 * They include /api prefix as part of the path
 */
export const API_ENDPOINTS = {
  // Charging endpoints
  charging: {
    start: "/api/v1/charging/start",
    stop: "/api/v1/charging/stop",
    status: (sessionId: string) => `/api/v1/charging/status/${sessionId}`,
  },

  // Station endpoints
  station: {
    status: (stationId: string) => `/api/v1/station/status/${stationId}`,
    list: "/api/v1/stations",
    detail: (stationId: string) => `/api/v1/stations/${stationId}`,
  },

  // Location endpoints
  locations: {
    all: "/api/v1/locations",
    detail: (id: string) => `/api/v1/locations/${id}`,
    ws: "/api/v1/locations/ws/locations",
  },

  // Balance endpoints
  balance: {
    current: "/api/v1/balance/get", // Auto-extracts client_id from cookie
    get: (clientId: string) => `/api/v1/balance/${clientId}`, // For admin
    topupQR: "/api/v1/balance/topup-qr",
    topupCard: "/api/v1/balance/topup-card",
  },

  // Payment endpoints
  payment: {
    h2hPayment: "/api/v1/payment/h2h-payment",
    tokenPayment: "/api/v1/payment/token-payment",
    createToken: "/api/v1/payment/create-token",
    status: (invoiceId: string) => `/api/v1/payment/status/${invoiceId}`,
    statusCheck: (invoiceId: string) =>
      `/api/v1/payment/status-check/${invoiceId}`,
    cancel: (invoiceId: string) => `/api/v1/payment/cancel/${invoiceId}`,
    webhook: "/api/v1/payment/webhook",
  },

  // Auth endpoints
  auth: {
    csrf: "/api/v1/auth/csrf",
    csrfAlias: "/api/v1/auth/cierra",
    login: "/api/v1/auth/login",
    signIn: "/api/v1/auth/signin",
    signUp: "/api/v1/auth/signup",
    signOut: "/api/v1/auth/logout",
    verify: "/api/v1/auth/verify",
    refresh: "/api/v1/auth/refresh",
    profile: "/api/v1/profile",
    me: "/api/v1/auth/me",
    smsSendOtp: "/api/v1/auth/sms/send-otp",
    smsVerify: "/api/v1/auth/sms/verify",
  },

  // Favorites endpoints
  favorites: {
    list: "/api/v1/favorites",
    add: "/api/v1/favorites",
    remove: (locationId: string) => `/api/v1/favorites/${locationId}`,
    check: (locationId: string) => `/api/v1/favorites/${locationId}/check`,
    toggle: (locationId: string) => `/api/v1/favorites/${locationId}/toggle`,
  },

  // History endpoints
  history: {
    charging: "/api/v1/history/charging",
    transactions: "/api/v1/history/transactions",
    stats: "/api/v1/history/stats",
  },
} as const;
