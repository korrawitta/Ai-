import { useState } from 'react'

const PLAN = [
  { label: 'PTT (SET)', action: 'sell', amount: '฿85,000' },
  { label: 'AAPL (NASDAQ)', action: 'sell', amount: '$620' },
  { label: 'BTC (Spot)', action: 'buy', amount: '$980' },
  { label: 'ETH (Spot)', action: 'buy', amount: '฿12,500' },
]

export default function Rebalance() {
  const [generated, setGenerated] = useState(false)
  const [reminderSet, setReminderSet] = useState(false)

  return (
    <>
      <h1 className="page-title">แจ้งเตือนการปรับพอร์ต</h1>
      <p className="page-sub">พอร์ตของคุณเบี่ยงเบนจากเป้าหมายเกินเกณฑ์ที่ตั้งไว้</p>

      <div className="alert-banner">
        <div className="ic">⚠️</div>
        <div className="txt">
          <strong>หุ้นไทยเกินสัดส่วนเป้าหมาย 12%</strong>
          <span>ตรวจพบเมื่อ 08:42 น. — สัดส่วนคริปโตต่ำกว่าเป้า 8%</span>
        </div>
      </div>

      <div className="plan-card">
        {PLAN.map((p) => (
          <div className="plan-row" key={p.label}>
            <span className="lbl">{p.label}</span>
            <span className="act">
              <span className={'action-tag ' + p.action}>
                {p.action === 'sell' ? 'ขาย' : 'ซื้อ'}
              </span>
              <span className="amt">{p.amount}</span>
            </span>
          </div>
        ))}
      </div>

      <button className="cta-btn" onClick={() => setGenerated(true)}>
        {generated ? 'แผนถูกสร้างแล้ว ✓' : 'Generate Rebalancing Plan'}
      </button>

      <button className="ghost-btn" onClick={() => setReminderSet(true)}>
        {reminderSet ? 'ตั้งเตือนแล้ว ✓' : 'เตือนฉันอีกครั้งใน 7 วัน'}
      </button>

      {generated && (
        <div className="after-plan show">
          <div className="confirm-box">
            แผนพร้อมแล้ว — ตรวจสอบจำนวนและกดยืนยันในหน้าคำสั่งซื้อ/ขาย
          </div>
        </div>
      )}
    </>
  )
}
