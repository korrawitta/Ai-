const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

/** Batch quote lookup. symbols: string[] of Yahoo Finance tickers,
 *  e.g. ['PTT.BK', 'AAPL', 'BTC-USD'] */
export function fetchQuotes(symbols) {
  const query = encodeURIComponent(symbols.join(','))
  return fetch(`${API_BASE}/api/quotes?symbols=${query}`).then(handle)
}

/** OHLCV candles for one symbol. range/interval use yfinance's own
 *  period/interval strings (e.g. range='1mo', interval='1d'). */
export function fetchHistory(symbol, range = '1mo', interval = '1d') {
  return fetch(
    `${API_BASE}/api/history/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
  ).then(handle)
}

/** Pivot-point support/resistance levels for one symbol. */
export function fetchLevels(symbol) {
  return fetch(`${API_BASE}/api/levels/${encodeURIComponent(symbol)}`).then(handle)
}

/** Send a reminder email via the backend's SMTP-backed /api/notify endpoint. */
export function sendReminderEmail(email, subject, message) {
  return fetch(`${API_BASE}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, subject, message }),
  }).then(handle)
}
