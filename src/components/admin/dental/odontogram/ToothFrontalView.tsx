import React from "react";
import { getToothType, isUpperTooth, TOOTH_SHAPES, FRONTAL_CONDITION_COLORS } from "./tooth-shapes";

interface ToothFrontalViewProps {
  toothNumber: number;
  fullToothCondition?: string;
  vestibularCondition?: string;
  onClick?: () => void;
  size?: number;
}

export function ToothFrontalView({
  toothNumber,
  fullToothCondition,
  vestibularCondition,
  onClick,
  size = 1,
}: ToothFrontalViewProps) {
  const toothType = getToothType(toothNumber);
  const isUpper = isUpperTooth(toothNumber);
  const shape = TOOTH_SHAPES[toothType];
  
  const scale = size;
  const width = shape.width * scale;
  const height = shape.height * scale;
  
  // Determine colors based on conditions
  const crownColor = vestibularCondition 
    ? FRONTAL_CONDITION_COLORS[vestibularCondition] || "#ffffff"
    : "#ffffff";
  
  const rootColor = fullToothCondition === "endodontic" 
    ? FRONTAL_CONDITION_COLORS.endodontic 
    : fullToothCondition === "implant"
    ? FRONTAL_CONDITION_COLORS.implant
    : "#ffffff";

  const isMissing = fullToothCondition === "missing";
  const isExtraction = fullToothCondition === "extraction";
  const isImplant = fullToothCondition === "implant";
  const isCrown = fullToothCondition === "crown";
  const isProsthesis = fullToothCondition === "prosthesis";

  // For upper teeth, roots go up (rotate 180)
  // For lower teeth, roots go down (normal)
  const transform = isUpper ? `scale(1, -1) translate(0, -${shape.height})` : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${shape.width} ${shape.height}`}
      className="cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <g transform={transform}>
        {/* Roots */}
        {!isMissing && !isImplant && shape.rootPaths.map((path, index) => (
          <path
            key={`root-${index}`}
            d={path}
            fill={rootColor}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray={isExtraction ? "2,2" : "none"}
            opacity={isExtraction ? 0.5 : 1}
          />
        ))}

        {/* Implant visual (screw shape) */}
        {isImplant && (
          <g>
            {/* Implant screw body */}
            <rect
              x={shape.width / 2 - 6}
              y={shape.crownHeight}
              width={12}
              height={shape.height - shape.crownHeight - 4}
              fill={FRONTAL_CONDITION_COLORS.implant}
              stroke="#7c3aed"
              strokeWidth="1"
              rx="2"
            />
            {/* Screw threads */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`thread-${i}`}
                x1={shape.width / 2 - 6}
                y1={shape.crownHeight + 6 + i * 6}
                x2={shape.width / 2 + 6}
                y2={shape.crownHeight + 6 + i * 6}
                stroke="#7c3aed"
                strokeWidth="1"
              />
            ))}
          </g>
        )}

        {/* Crown */}
        <path
          d={shape.crownPath}
          fill={isCrown ? FRONTAL_CONDITION_COLORS.crown : isProsthesis ? FRONTAL_CONDITION_COLORS.prosthesis : crownColor}
          stroke={isMissing ? "#94a3b8" : "#64748b"}
          strokeWidth="1.5"
          strokeDasharray={isMissing ? "3,3" : "none"}
          opacity={isMissing ? 0.4 : 1}
        />

        {/* Crown indicator (metallic band) */}
        {isCrown && (
          <rect
            x={2}
            y={shape.crownHeight - 4}
            width={shape.width - 4}
            height={4}
            fill="#d97706"
            opacity={0.8}
          />
        )}

        {/* Extraction X marker */}
        {isExtraction && (
          <g stroke="#ef4444" strokeWidth="2">
            <line x1="4" y1="4" x2={shape.width - 4} y2={shape.crownHeight - 4} />
            <line x1={shape.width - 4} y1="4" x2="4" y2={shape.crownHeight - 4} />
          </g>
        )}

        {/* Endodontic canal lines inside roots */}
        {fullToothCondition === "endodontic" && shape.rootPaths.map((_, index) => {
          const rootCenterX = shape.width / 2 + (index - (shape.rootPaths.length - 1) / 2) * 10;
          return (
            <line
              key={`canal-${index}`}
              x1={rootCenterX}
              y1={shape.crownHeight + 4}
              x2={rootCenterX}
              y2={shape.height - 8}
              stroke={FRONTAL_CONDITION_COLORS.endodontic}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </svg>
  );
}
