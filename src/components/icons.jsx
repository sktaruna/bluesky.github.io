// Small inline glyphs — no icon library dependency.
const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none' }

export function GotoIcon(props) {
  return (
    <svg {...common} {...props}>
      <path
        d="M6 8h9a4 4 0 0 1 0 8h-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M14.5 13.5 12.5 16l2 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// --- new 10-type registry icons ---

export function CollectIcon(props) {
  return (
    <svg {...common} {...props}>
      <path
        d="M4 12h4l1.5 3h5L16 12h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 12 7.2 6.4A1.5 1.5 0 0 1 8.66 5.2h6.68a1.5 1.5 0 0 1 1.46 1.2L18 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="4" y="12" width="16" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  )
}

export function ActionIcon(props) {
  return (
    <svg {...common} {...props}>
      <path
        d="M7 5.5v13l11-6.5-11-6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChoiceIcon(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 6.5c4 0 4 5.5 8 5.5M8 17.5c4 0 4-5.5 8-5.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  )
}

export function ConfirmIcon(props) {
  return (
    <svg {...common} {...props}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 12.5l2.6 2.6L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function GuideIcon(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M15 9l-2 5-4.5 2 2-5L15 9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export function InvestigateIcon(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M18.5 18.5 15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IfIcon(props) {
  return (
    <svg {...common} {...props}>
      <path d="M12 5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 10 6 15v4M12 10l6 5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="8.5" r="1.3" fill="currentColor" />
    </svg>
  )
}

export function EscalateIcon(props) {
  return (
    <svg {...common} {...props}>
      <path d="M12 18V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 10.5 12 5.5l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5.5 18.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function DoneIcon(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 12.3l2.6 2.6L16 9.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function SparkleIcon(props) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 2.5 13.8 9 20 11l-6.2 2L12 19.5 10.2 13 4 11l6.2-2L12 2.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function TrashIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export const PRIMITIVE_ICON = {
  collect: CollectIcon,
  action: ActionIcon,
  choice: ChoiceIcon,
  confirm: ConfirmIcon,
  guide: GuideIcon,
  investigate: InvestigateIcon,
  if: IfIcon,
  escalate: EscalateIcon,
  done: DoneIcon,
  goto: GotoIcon,
}
