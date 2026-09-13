import { useMemo, useState } from 'react'

export function Tabs({ tabs = [], defaultTab }) {
  const initialTab = useMemo(() => defaultTab || tabs[0]?.id || '', [defaultTab, tabs])
  const [activeTab, setActiveTab] = useState(initialTab)

  if (!tabs.length) {
    return null
  }

  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <div className="cf-tabs">
      <div role="tablist" className="cf-tabs-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            className={`cf-tab ${active.id === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={active.id === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="cf-tab-panel" role="tabpanel">
        {active.content}
      </div>
    </div>
  )
}
