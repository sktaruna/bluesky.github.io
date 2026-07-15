// Small inline glyphs — no icon library dependency.
const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none' }

export function SayIcon(props) {
  return (
    <svg {...common} {...props}>
      <path
        d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4.4 3.3A.5.5 0 0 1 4 19v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AskIcon(props) {
  return (
    <svg {...common} {...props}>
      <path
        d="M9 9.5a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.1-1.5 2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="18" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function SetIcon(props) {
  return (
    <svg {...common} {...props}>
      <path d="M5 9h14M5 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="9" r="1.4" fill="currentColor" />
      <circle cx="7.5" cy="15" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function DoIcon(props) {
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

export function BranchIcon(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 6.5c4 0 4 5.5 8 5.5M8 17.5c4 0 4-5.5 8-5.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  )
}

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
  say: SayIcon,
  ask: AskIcon,
  set: SetIcon,
  do: DoIcon,
  branch: BranchIcon,
  goto: GotoIcon,
}
