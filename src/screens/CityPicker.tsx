import { useState } from 'react'
import { Search } from 'lucide-react'

const CITIES = [
  'Amsterdam', 'Barcelona', 'Berlin', 'Brussels', 'Copenhagen',
  'Dublin', 'Lisbon', 'London', 'Madrid', 'Milan',
  'Paris', 'Prague', 'Rome', 'Stockholm', 'Vienna',
  'Warsaw', 'New York', 'Los Angeles', 'Chicago', 'San Francisco',
  'Toronto', 'Sydney', 'Melbourne', 'Tokyo', 'Seoul',
]

interface CityPickerProps {
  onSelect: (city: string) => void
}

export function CityPicker({ onSelect }: CityPickerProps) {
  const [query, setQuery] = useState('')
  const filtered = CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'var(--parchment-deep)',
          borderRadius: 'var(--radius-card)',
          border: '1.5px solid var(--border-subtle)',
        }}
      >
        <Search size={16} color="var(--ink-soft)" />
        <input
          placeholder="Search cities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--ink)',
            flex: 1,
          }}
          autoFocus
        />
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filtered.map((city) => (
          <li key={city}>
            <button
              onClick={() => onSelect(city)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 4px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {city}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li style={{ padding: '16px 4px', color: 'var(--text-muted)', fontSize: '16px' }}>No cities found</li>
        )}
      </ul>
    </div>
  )
}
