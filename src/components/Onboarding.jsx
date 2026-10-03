import { useState } from 'react'

const RISK_OPTIONS = [
  { id: 'conservative', name: 'Conservative', desc: 'เน้นรักษาเงินต้น', pct: '20/80' },
  { id: 'balanced', name: 'Balanced ⭐ แนะนำ', desc: 'สมดุลความเสี่ยง/ผลตอบแทน', pct: '55/45' },
  { id: 'growth', name: 'Growth', desc: 'เน้นการเติบโตระยะยาว', pct: '80/20' },
]

export default function Onboarding() {
  const [selected, setSelected] = useState('balanced')
  const [confirmed, setConfirmed] = useState(false)

  const selectedOption = RISK_OPTIONS.find((o) => o.id === selected)

  return (
    <>
      <div className="progress-dots">
        <span className="done" />
        <span className="done" />
        <span />
        <span />
      </div>
      <h1 className="page-title">มาทำความรู้จักกัน</h1>
      <p className="page-sub">
        ตอบคำถามสั้น ๆ เพื่อให้ AI ประเมินระดับความเสี่ยงที่เหมาะกับคุณ
      </p>

      <div className="chat-wrap">
        <div className="bubble bot">
          สวัสดีครับ 👋 ผมจะช่วยประเมินโปรไฟล์ความเสี่ยงของคุณ ก่อนอื่น —
          ถ้าพอร์ตคุณลดลง 15% ใน 1 เดือน คุณจะรู้สึกอย่างไร?
        </div>
        <div className="bubble user">กังวลแต่ยังถือต่อได้ ถ้ามีเหตุผลรองรับ</div>
        <div className="bubble bot">
          เข้าใจแล้ว แล้วเป้าหมายการลงทุนของคุณคือระยะเวลาไหน?
        </div>
        <div className="bubble user">5 ปีขึ้นไป</div>
        <div className="bubble bot">
          จากคำตอบของคุณ ผมแนะนำโปรไฟล์ความเสี่ยงนี้ — เลือกเพื่อยืนยัน หรือปรับเองได้
          <div className="risk-options">
            {RISK_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className="risk-opt"
                style={{ borderColor: selected === opt.id ? 'var(--gold)' : 'var(--line)' }}
                onClick={() => {
                  setSelected(opt.id)
                  setConfirmed(false) // changing the choice requires re-confirming
                }}
              >
                <div>
                  <div className="name">{opt.name}</div>
                  <div className="desc">{opt.desc}</div>
                </div>
                <div className="pct">{opt.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="cta-btn" onClick={() => setConfirmed(true)}>
        {confirmed
          ? `ยืนยัน ${selectedOption?.name.split(' ')[0]} Profile แล้ว ✓`
          : `ยืนยัน ${selectedOption?.name.split(' ')[0]} Profile`}
      </button>

      {confirmed && (
        <div className="confirm-box" style={{ marginTop: 12 }}>
          บันทึกโปรไฟล์ความเสี่ยงแล้ว — ไปที่แท็บ "พอร์ต" ด้านล่างเพื่อดูภาพรวมได้เลย
        </div>
      )}
    </>
  )
}
