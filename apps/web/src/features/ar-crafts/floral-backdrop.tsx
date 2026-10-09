export function FloralBackdrop() {
  return <div className="floral-backdrop" aria-hidden="true" />;
}

/** Crisp botanical linework, decorative and independent of CMS assets. */
export function FloralAccent({ className }: { className: string }) {
  return (
    <svg
      className={`floral-accent ${className}`}
      viewBox="0 0 140 190"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          data-floral-stem=""
          pathLength="1"
          d="M63 176C90 139 64 112 76 77M72 145C46 141 35 125 37 115C54 117 68 128 72 145ZM72 121C92 118 103 105 100 95C83 99 74 109 72 121Z"
        />
        <g data-floral-petals="">
          <ellipse cx="76" cy="58" rx="9" ry="19" />
          <ellipse
            cx="76"
            cy="58"
            rx="9"
            ry="19"
            transform="rotate(60 76 77)"
          />
          <ellipse
            cx="76"
            cy="58"
            rx="9"
            ry="19"
            transform="rotate(120 76 77)"
          />
          <ellipse
            cx="76"
            cy="58"
            rx="9"
            ry="19"
            transform="rotate(180 76 77)"
          />
          <ellipse
            cx="76"
            cy="58"
            rx="9"
            ry="19"
            transform="rotate(240 76 77)"
          />
          <ellipse
            cx="76"
            cy="58"
            rx="9"
            ry="19"
            transform="rotate(300 76 77)"
          />
          <circle cx="76" cy="77" r="5" className="floral-heart" />
        </g>
      </g>
    </svg>
  );
}
