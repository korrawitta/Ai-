import { useEffect, useState } from 'react'
import { fetchQuotes } from '../api.js'

const ALLOCATIONS = [
  { name: 'หุ้นไทย', color: 'var(--gold)', current: 47, target: 35, drift: true },
  { name: 'หุ้นต่างประเทศ', color: 'var(--jade)', current: 31, target: 35, drift: false },
  { name: 'คริปโต / อื่น ๆ', color: '#5B6FE0', current: 22, target: 30, drift: false },
]

// Symbols follow Yahoo Finance's format: ".BK" suffix for SET-listed
// stocks, "-USD" pairs for crypto.
const HOLDING_SYMBOLS = ['PTT.BK', 'AAPL', 'BTC-USD']

export default function Dashboard() {
  const [holdings, setHoldings] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchQuotes(HOLDING_SYMBOLS)
      .then((data) => alive && setHoldings(data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <h1 className="page-title">พอร์ตของคุณ</h1>
      <p className="page-sub">เทียบสัดส่วนปัจจุบันกับเป้าหมายที่ตั้งไว้</p>

      <div className="hero-value">
        <div className="label">มูลค่าพอร์ตรวม</div>
        <div className="amount">฿1,284,650</div>
        <span className="delta">▲ +2.4% วันนี้</span>
      </div>

      <div className="alloc-section">
        <div className="alloc-title">
          Current vs Target Allocation <span className="tag">⚠ เบี่ยงเบน 12%</span>
        </div>
        <div className="alloc-bar">
          {ALLOCATIONS.map((a) => (
            <div key={a.name} style={{ width: a.current + '%', background: a.color }} />
          ))}
        </div>
        {ALLOCATIONS.map((a) => (
          <div className="alloc-row" key={a.name}>
            <span className="name">
              <span className="dot" style={{ background: a.color }} />
              {a.name}
            </span>
            <span className="vals">
              <div className="cur">{a.current}%</div>
              <div className={'tgt' + (a.drift ? ' drift' : '')}>เป้า {a.target}%</div>
            </span>
          </div>
        ))}
      </div>

      <div className="holdings-title">การถือครองหลัก</div>

      {error && (
        <p className="page-sub" style={{ color: 'var(--coral)' }}>
          โหลดราคาไม่สำเร็จ: {error} — ตรวจสอบว่า backend (backend/app.py) กำลังรันอยู่
        </p>
      )}
      {loading && !holdings.length && <p className="page-sub">กำลังโหลดราคา…</p>}

      {holdings.map((h) =>
        h.error ? (
          <div className="holding" key={h.symbol}>
            <div>
              <span className="sym">{h.symbol}</span>
            </div>
            <div className="px down">n/a</div>
          </div>
        ) : (
          <div className="holding" key={h.symbol}>
            <div>
              <span className="sym">{h.symbol}</span>
            </div>
            <div>
              <div className="px">{h.price.toLocaleString()}</div>
              <div className={'chg ' + (h.change_percent >= 0 ? 'up' : 'down')}>
                {h.change_percent >= 0 ? '+' : ''}
                {h.change_percent.toFixed(2)}%
              </div>
            </div>
          </div>
        )
      )}
    </>
  )
}
