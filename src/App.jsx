import { useState } from 'react'
import Onboarding from './components/Onboarding.jsx'
import Dashboard from './components/Dashboard.jsx'
import PriceTracker from './components/PriceTracker.jsx'
import Rebalance from './components/Rebalance.jsx'
import TabBar from './components/TabBar.jsx'

const SCREENS = [
  { id: 'onboard', label: '1. Onboarding' },
  { id: 'dash', label: '2. Dashboard' },
  { id: 'tracker', label: '3. Price Tracker' },
  { id: 'rebalance', label: '4. Rebalance' },
]

export default function App() {
  const [screen, setScreen] = useState('onboard')

  return (
    <div className="page">
      <div className="stage-label">
        ตัวอย่าง UI — เลื่อนแท็บด้านล่างเพื่อดูแต่ละหน้าจอ
      </div>

      <div className="switcher">
        {SCREENS.map((s) => (
          <button
            key={s.id}
            className={screen === s.id ? 'active' : ''}
            onClick={() => setScreen(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="phone">
        <div className="notch" />

        <div className="screen active">
          {screen === 'onboard' && <Onboarding />}
          {screen === 'dash' && <Dashboard />}
          {screen === 'tracker' && <PriceTracker />}
          {screen === 'rebalance' && <Rebalance />}
        </div>

        <TabBar active={screen} onChange={setScreen} />
      </div>
    </div>
  )
}
