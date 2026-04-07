interface TurtleLogoProps {
  className?: string
  size?: number
}

export function TurtleLogo({ className = "", size = 32 }: TurtleLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cute baby sea turtle - top-down swimming view */}

        {/* Shadow/glow */}
        <ellipse cx="50" cy="54" rx="24" ry="18" fill="#059669" opacity="0.08" />

        {/* Back flippers */}
        <ellipse cx="33" cy="68" rx="7" ry="4" fill="#6ee7b7" transform="rotate(-30 33 68)" />
        <ellipse cx="67" cy="68" rx="7" ry="4" fill="#6ee7b7" transform="rotate(30 67 68)" />

        {/* Front flippers - spread wide like flying */}
        <path
          d="M28 40 C22 34, 12 32, 10 36 C8 40, 14 42, 20 42 C24 42, 27 42, 30 43"
          fill="#6ee7b7"
          stroke="#34d399"
          strokeWidth="0.8"
        />
        <path
          d="M72 40 C78 34, 88 32, 90 36 C92 40, 86 42, 80 42 C76 42, 73 42, 70 43"
          fill="#6ee7b7"
          stroke="#34d399"
          strokeWidth="0.8"
        />

        {/* Shell - main body */}
        <ellipse cx="50" cy="50" rx="22" ry="20" fill="url(#cuteShell)" stroke="#10b981" strokeWidth="1.5" />

        {/* Shell center pattern - cute heart-like scutes */}
        <path
          d="M50 35 C47 38, 44 41, 44 44 C44 47, 47 49, 50 49 C53 49, 56 47, 56 44 C56 41, 53 38, 50 35Z"
          fill="#34d399"
          opacity="0.5"
        />
        <path
          d="M50 49 C47 52, 44 55, 44 58 C44 61, 47 63, 50 63 C53 63, 56 61, 56 58 C56 55, 53 52, 50 49Z"
          fill="#34d399"
          opacity="0.4"
        />

        {/* Shell side scutes */}
        <path d="M35 42 C33 45, 33 49, 35 52" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M65 42 C67 45, 67 49, 65 52" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M37 53 C35 56, 35 59, 37 61" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M63 53 C65 56, 65 59, 63 61" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Shell highlight */}
        <ellipse cx="45" cy="42" rx="8" ry="5" fill="white" opacity="0.15" />

        {/* Head */}
        <ellipse cx="50" cy="28" rx="10" ry="9" fill="#6ee7b7" stroke="#34d399" strokeWidth="1" />

        {/* Cheeks - blush */}
        <circle cx="43" cy="29" r="3" fill="#f9a8d4" opacity="0.35" />
        <circle cx="57" cy="29" r="3" fill="#f9a8d4" opacity="0.35" />

        {/* Eyes - big cute round eyes */}
        <circle cx="45" cy="26" r="3.5" fill="white" />
        <circle cx="55" cy="26" r="3.5" fill="white" />
        <circle cx="46" cy="26" r="2.2" fill="#1e293b" />
        <circle cx="56" cy="26" r="2.2" fill="#1e293b" />
        <circle cx="46.8" cy="25" r="0.9" fill="white" />
        <circle cx="56.8" cy="25" r="0.9" fill="white" />

        {/* Smile */}
        <path d="M47 31 C48.5 33, 51.5 33, 53 31" stroke="#047857" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Tiny tail */}
        <path d="M50 70 C50 73, 49 75, 48 76" stroke="#6ee7b7" strokeWidth="2" fill="none" strokeLinecap="round" />

        <defs>
          <radialGradient id="cuteShell" cx="45%" cy="40%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="40%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
