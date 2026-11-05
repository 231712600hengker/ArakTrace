export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M29 14V56H8V47H13V38H18V29H23V20H29Z" fill="#1F6B4A" />
      <path d="M35 14V56H56V47H51V38H46V29H41V20H35Z" fill="#1F6B4A" />
      <rect x="14" y="5" width="36" height="6" fill="#C98A1B" />
    </svg>
  );
}
export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="wordmark"><span>Arak</span><span className="trace">Trace</span><span className="bali">BALI</span></span>
    </span>
  );
}
