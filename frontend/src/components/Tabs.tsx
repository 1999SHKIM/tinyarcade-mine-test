interface TabItem<T extends string> {
  key: T
  label: string
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[]
  activeKey: T
  onChange: (key: T) => void
}

export function Tabs<T extends string>({ tabs, activeKey, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-2 border-b border-slate-200">
      {tabs.map((tab) => {
        const active = tab.key === activeKey
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
