/** 記号は全部 SVG で描き、読み上げない（design.md「6」） */

export function LogoIcon() {
  return (
    <svg className="logo-icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="2.75" y="2.75" width="14.5" height="14.5" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 16.5 16.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M0 3.25h16M0 8h16M0 12.75h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg className="check-icon" width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path
        d="M1.75 6.25 4.75 9.25 10.25 2.75"
        fill="none"
        stroke="currentColor"
        strokeWidth={(1.5 * 12) / size}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg className="alert-icon" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <circle cx="7" cy="7" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 3.75v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="10.1" r="0.9" fill="currentColor" />
    </svg>
  );
}

/** 返す組の矢印（線 2px、先端は線で描いた「>」8px） */
export function TransferArrow() {
  return (
    <span className="arrow" aria-hidden="true">
      <span className="arrow-line" />
      <svg className="arrow-head" width="8" height="12" viewBox="0 0 8 12" focusable="false">
        <path d="M1 1 7 6 1 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
