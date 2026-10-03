import { useEffect, useState } from 'react'
import { fetchQuotes, fetchHistory, fetchLevels } from '../api.js'

const DEFAULT_WATCHLIST = ['PTT.BK', 'AAPL', 'BTC-USD', 'ETH-USD']

const RANGES = [
  { label: '1D', range: '5d', interval: '15m' },
  { label: '1W', range: '5d', interval: '1d' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1wk' },
]

// Map an array of closing prices onto an SVG polyline's "x,y x,y ..." points
function toPolylinePoints(closes, width = 320, height = 100, topPad = 10) {
  if (!closes.length) return ''
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const step = closes.length > 1 ? width / (closes.length - 1) : 0
  return closes
    .map((price, i) => {
      const x = i * step
      const y = topPad + (height - ((price - min) / span) * height)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function PriceTracker() {
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST)
  const [focusSymbol, setFocusSymbol] = useState(DEFAULT_WATCHLIST[0])
  const [rangeIdx, setRangeIdx] = useState(1) // default to 1W

  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  const [tickers, setTickers] = useState([])
  const [history, setHistory] = useState([])
  const [levels, setLevels] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Watchlist quotes: refresh whenever the watchlist itself changes
  // (symbol added/removed) or the visible range changes.
  useEffect(() => {
    let alive = true
    fetchQuotes(watchlist).then((quotes) => alive && setTickers(quotes)).catch(() => {})
    return () => {
      alive = false
    }
  }, [watchlist, rangeIdx])

  // Chart + levels: refetch whenever the focused symbol or range changes.
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    const { range, interval } = RANGES[rangeIdx]

    Promise.all([fetchHistory(focusSymbol, range, interval), fetchLevels(focusSymbol)])
      .then(([hist, lvl]) => {
        if (!alive) return
        setHistory(hist)
        setLevels(lvl)
      })
      .catch((err) => {
        if (alive) setError(err.message)
      })
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [focusSymbol, rangeIdx])

  const handleSearch = async (e) => {
    e.preventDefault()
    const symbol = searchInput.trim().toUpperCase()
    if (!symbol) return

    setSearching(true)
    setSearchError(null)
    try {
      const [quote] = await fetchQuotes([symbol])
      if (quote.error) {
        setSearchError(`ไม่พบสัญลักษณ์ "${symbol}" บน Yahoo Finance`)
      } else {
        setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]))
        setFocusSymbol(symbol)
        setSearchInput('')
      }
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const removeSymbol = (e, symbol) => {
    e.stopPropagation() // don't also trigger the chip's onClick (focus change)
    setWatchlist((prev) => {
      if (prev.length <= 1) return prev // keep at least one symbol
      const next = prev.filter((s) => s !== symbol)
      if (focusSymbol === symbol) setFocusSymbol(next[0])
      return next
    })
  }

  const focusQuote = tickers.find((t) => t.symbol === focusSymbol)
  const points = toPolylinePoints(history.map((h) => h.close))

  return (
    <>
      <h1 className="page-title">ติดตามราคาสด</h1>
      <p className="page-sub">
        <span className="live-dot" />
        ข้อมูลจาก Yahoo Finance (yfinance) — ค้นหาเพิ่มสัญลักษณ์ หรือแตะการ์ดเพื่อดูกราฟ
      </p>

      <form className="ticker-search" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="ค้นหาสัญลักษณ์ เช่น TSLA, KBANK.BK, DOGE-USD"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="search-btn" disabled={searching}>
          {searching ? '…' : 'ค้นหา'}
        </button>
      </form>
      {searchError && (
        <p className="page-sub" style={{ color: 'var(--coral)', marginTop: -12 }}>
          {searchError}
        </p>
      )}

      {error && (
        <p className="page-sub" style={{ color: 'var(--coral)' }}>
          โหลดข้อมูลไม่สำเร็จ: {error} — ตรวจสอบว่า backend (backend/app.py) กำลังรันอยู่ที่ port 5000
        </p>
      )}

      <div className="ticker-strip">
        {tickers.map((t) =>
          t.error ? (
            <div className="ticker-chip" key={t.symbol}>
              <div className="t">{t.symbol}</div>
              <div className="p down">n/a</div>
            </div>
          ) : (
            <div
              className={'ticker-chip' + (t.symbol === focusSymbol ? ' active' : '')}
              key={t.symbol}
              onClick={() => setFocusSymbol(t.symbol)}
              role="button"
              tabIndex={0}
            >
              {watchlist.length > 1 && (
                <span className="remove" onClick={(e) => removeSymbol(e, t.symbol)}>
                  ×
                </span>
              )}
              <div className="t">{t.symbol}</div>
              <div className={'p ' + (t.change_percent >= 0 ? 'up' : 'down')}>
                {t.price.toLocaleString()} {t.change_percent >= 0 ? '▲' : '▼'}
              </div>
            </div>
          )
        )}
        {!tickers.length && <div className="ticker-chip">กำลังโหลด…</div>}
      </div>

      <div className="chart-card">
        <div className="chart-head">
          <div>
            <div className="sym">{focusSymbol}</div>
            <div className="exch">Yahoo Finance</div>
          </div>
          <div className={'px ' + (focusQuote && focusQuote.change_percent >= 0 ? 'up' : 'down')}>
            {focusQuote && !focusQuote.error ? focusQuote.price.toLocaleString() : '—'}
          </div>
        </div>
        <svg viewBox="0 0 320 120" width="100%" height="120" preserveAspectRatio="none">
          {levels && !levels.error && (
            <>
              <line
                x1="0" y1="34" x2="320" y2="34"
                stroke="var(--coral)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"
              />
              <line
                x1="0" y1="88" x2="320" y2="88"
                stroke="var(--jade)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"
              />
            </>
          )}
          {points && <polyline fill="none" stroke="var(--gold)" strokeWidth="2.5" points={points} />}
        </svg>
        <div className="range-tabs">
          {RANGES.map((r, i) => (
            <span
              key={r.label}
              className={i === rangeIdx ? 'on' : ''}
              style={{ cursor: 'pointer' }}
              onClick={() => setRangeIdx(i)}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      <div className="levels-title">แนวรับ / แนวต้าน (Pivot Points จากแท่งเทียนล่าสุด)</div>
      {levels && !levels.error ? (
        <>
          <div className="level-row resist">
            <span className="k">แนวต้าน R2</span>
            <span className="v">{levels.r2.toLocaleString()}</span>
          </div>
          <div className="level-row resist">
            <span className="k">แนวต้าน R1</span>
            <span className="v">{levels.r1.toLocaleString()}</span>
          </div>
          <div className="level-row support">
            <span className="k">แนวรับ S1</span>
            <span className="v">{levels.s1.toLocaleString()}</span>
          </div>
          <div className="level-row support">
            <span className="k">แนวรับ S2</span>
            <span className="v">{levels.s2.toLocaleString()}</span>
          </div>
        </>
      ) : (
        <p className="page-sub">กำลังคำนวณ…</p>
      )}
    </>
  )
}
