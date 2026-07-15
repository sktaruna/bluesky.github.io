import { EXAMPLES } from '../graph/examples'
import './exampleSwitcher.css'

export default function ExampleSwitcher({ activeKey, onChange }) {
  return (
    <div className="example-switcher">
      {EXAMPLES.map((ex) => (
        <button
          key={ex.key}
          className={`example-switcher__tab ${ex.key === activeKey ? 'example-switcher__tab--active' : ''}`}
          onClick={() => onChange(ex.key)}
        >
          {ex.label}
        </button>
      ))}
    </div>
  )
}
