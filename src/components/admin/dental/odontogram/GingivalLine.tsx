import React from "react";

interface GingivalLineProps {
  width: number;
  className?: string;
}

export function GingivalLine({ width, className = "" }: GingivalLineProps) {
  return (
    <svg
      width={width}
      height="8"
      viewBox={`0 0 ${width} 8`}
      className={className}
      preserveAspectRatio="none"
    >
      {/* Gingival line - wavy pattern */}
      <path
        d={generateWavyPath(width)}
        fill="none"
        stroke="#f87171"
        strokeWidth="2"
        opacity="0.6"
      />
      {/* Subtle fill below the line */}
      <path
        d={`${generateWavyPath(width)} L${width},8 L0,8 Z`}
        fill="#fecaca"
        opacity="0.2"
      />
    </svg>
  );
}

function generateWavyPath(width: number): string {
  const segments = Math.ceil(width / 20);
  let path = "M0,4";
  
  for (let i = 0; i < segments; i++) {
    const x1 = i * 20 + 5;
    const x2 = i * 20 + 15;
    const x3 = (i + 1) * 20;
    path += ` Q${x1},2 ${x2 > width ? width : x2},4`;
    if (x3 <= width) {
      path += ` Q${x3 - 5},6 ${x3},4`;
    }
  }
  
  return path;
}
