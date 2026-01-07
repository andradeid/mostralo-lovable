// SVG paths for different tooth types - frontal/vestibular view
// Each tooth type has crown path, root paths, and dimensions

export type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor';

export interface ToothShape {
  crownPath: string;
  rootPaths: string[];
  width: number;
  height: number;
  crownHeight: number;
}

// Determine tooth type based on FDI notation
export function getToothType(toothNumber: number): ToothType {
  const lastDigit = toothNumber % 10;
  
  if (lastDigit >= 6 && lastDigit <= 8) return 'molar';
  if (lastDigit >= 4 && lastDigit <= 5) return 'premolar';
  if (lastDigit === 3) return 'canine';
  return 'incisor'; // 1, 2
}

// Check if tooth is in upper arch
export function isUpperTooth(toothNumber: number): boolean {
  const quadrant = Math.floor(toothNumber / 10);
  return quadrant === 1 || quadrant === 2;
}

// SVG shapes for each tooth type (viewBox 0 0 40 60)
export const TOOTH_SHAPES: Record<ToothType, ToothShape> = {
  molar: {
    width: 40,
    height: 60,
    crownHeight: 24,
    // Crown - wide rectangular shape
    crownPath: "M4,0 L36,0 Q40,0 40,4 L40,20 Q40,24 36,24 L4,24 Q0,24 0,20 L0,4 Q0,0 4,0 Z",
    // 3 roots for molars
    rootPaths: [
      "M6,24 L4,55 Q4,58 7,58 L11,58 Q14,58 14,55 L12,24",
      "M17,24 L16,50 Q16,54 20,54 L24,54 Q28,54 28,50 L27,24",
      "M30,24 L28,55 Q28,58 31,58 L35,58 Q38,58 38,55 L36,24"
    ]
  },
  premolar: {
    width: 32,
    height: 55,
    crownHeight: 22,
    // Crown - medium width
    crownPath: "M4,0 L28,0 Q32,0 32,4 L32,18 Q32,22 28,22 L4,22 Q0,22 0,18 L0,4 Q0,0 4,0 Z",
    // 2 roots for premolars
    rootPaths: [
      "M5,22 L4,48 Q4,52 8,52 L12,52 Q16,52 16,48 L15,22",
      "M17,22 L16,48 Q16,52 20,52 L24,52 Q28,52 28,48 L27,22"
    ]
  },
  canine: {
    width: 28,
    height: 58,
    crownHeight: 24,
    // Crown - pointed shape
    crownPath: "M6,0 L22,0 Q26,0 27,4 L28,16 Q28,20 24,24 L14,24 L4,24 Q0,20 0,16 L1,4 Q2,0 6,0 Z",
    // 1 long root
    rootPaths: [
      "M8,24 L6,52 Q6,56 14,56 Q22,56 22,52 L20,24"
    ]
  },
  incisor: {
    width: 24,
    height: 50,
    crownHeight: 20,
    // Crown - narrow rectangular
    crownPath: "M4,0 L20,0 Q24,0 24,4 L24,16 Q24,20 20,20 L4,20 Q0,20 0,16 L0,4 Q0,0 4,0 Z",
    // 1 root
    rootPaths: [
      "M6,20 L5,44 Q5,48 12,48 Q19,48 19,44 L18,20"
    ]
  }
};

// Colors for conditions on frontal view
export const FRONTAL_CONDITION_COLORS: Record<string, string> = {
  healthy: "#22c55e",
  caries: "#ef4444",
  restoration: "#3b82f6",
  extraction: "#6b7280",
  missing: "#d1d5db",
  implant: "#8b5cf6",
  crown: "#f59e0b",
  endodontic: "#ec4899",
  prosthesis: "#14b8a6",
  fracture: "#f97316",
};
