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
        className="transition-all duration-300 hover:scale-105"
      >
        {/* Simplified main shell */}
        <ellipse cx="50" cy="45" rx="30" ry="25" fill="url(#shellGradient)" stroke="#047857" strokeWidth="2" />

        {/* Simple shell pattern */}
        <g stroke="#065f46" strokeWidth="1.5" fill="none" opacity="0.6">
          <ellipse cx="50" cy="35" rx="8" ry="6" />
          <ellipse cx="40" cy="45" rx="6" ry="5" />
          <ellipse cx="60" cy="45" rx="6" ry="5" />
          <ellipse cx="50" cy="55" rx="8" ry="6" />
        </g>

        {/* Head */}
        <ellipse cx="50" cy="20" rx="10" ry="12" fill="url(#headGradient)" stroke="#047857" strokeWidth="1.5" />

        {/* Eyes */}
        <circle cx="47" cy="18" r="2" fill="#1e293b" />
        <circle cx="53" cy="18" r="2" fill="#1e293b" />
        <circle cx="47.5" cy="17.5" r="0.5" fill="white" />
        <circle cx="53.5" cy="17.5" r="0.5" fill="white" />

        {/* Simplified flippers */}
        <ellipse
          cx="25"
          cy="40"
          rx="6"
          ry="15"
          fill="url(#flipperGradient)"
          stroke="#047857"
          strokeWidth="1"
          transform="rotate(-20 25 40)"
        />
        <ellipse
          cx="75"
          cy="40"
          rx="6"
          ry="15"
          fill="url(#flipperGradient)"
          stroke="#047857"
          strokeWidth="1"
          transform="rotate(20 75 40)"
        />
        <ellipse
          cx="35"
          cy="65"
          rx="5"
          ry="12"
          fill="url(#flipperGradient)"
          stroke="#047857"
          strokeWidth="1"
          transform="rotate(-10 35 65)"
        />
        <ellipse
          cx="65"
          cy="65"
          rx="5"
          ry="12"
          fill="url(#flipperGradient)"
          stroke="#047857"
          strokeWidth="1"
          transform="rotate(10 65 65)"
        />

        {/* Brothers symbol - two small connected shells */}
        <g opacity="0.7">
          <ellipse cx="42" cy="80" rx="6" ry="4" fill="#6ee7b7" stroke="#047857" strokeWidth="0.8" />
          <ellipse cx="58" cy="80" rx="6" ry="4" fill="#6ee7b7" stroke="#047857" strokeWidth="0.8" />
          <line x1="48" y1="80" x2="52" y2="80" stroke="#34d399" strokeWidth="2" />
        </g>

        <defs>
          <radialGradient id="shellGradient" cx="40%" cy="30%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </radialGradient>

          <radialGradient id="headGradient" cx="50%" cy="30%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#34d399" />
          </radialGradient>

          <radialGradient id="flipperGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
