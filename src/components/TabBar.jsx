const TABS = [
  {
    id: 'onboard',
    label: 'เริ่มต้น',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c1.2-4 4.2-6 7-6s5.8 2 7 6" />
      </svg>
    ),
  },
  {
    id: 'dash',
    label: 'พอร์ต',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="12" width="4" height="8" />
        <rect x="10" y="6" width="4" height="14" />
        <rect x="16" y="9" width="4" height="11" />
      </svg>
    ),
  },
  {
    id: 'tracker',
    label: 'ราคา',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3,17 9,10 13,14 21,5" />
      </svg>
    ),
  },
  {
    id: 'rebalance',
    label: 'ปรับพอร์ต',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4v6h6M20 20v-6h-6" />
        <path d="M4.5 15a8 8 0 0 0 14-4M19.5 9a8 8 0 0 0-14 4" />
      </svg>
    ),
  },
]

export default function TabBar({ active, onChange }) {
  return (
    <div className="tabbar">
      {TABS.map((t) => (
        <div
          key={t.id}
          className={'tab' + (active === t.id ? ' on' : '')}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          {t.label}
        </div>
      ))}
    </div>
  )
}
