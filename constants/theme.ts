
// Main gradient: Olive green -> Mustard gold -> Sand beige
export const GRADIENT = [
  '#4F5B2A',
  '#B8892D',
  '#D8C9A8',
] as const;

// Background gradient: Ivory -> Light beige -> Sand beige
export const BG_GRADIENT = [
  '#F5EFE3',
  '#EFE5D3',
  '#D8C9A8',
] as const;

export const BG_START = { x: 0, y: 0 };
export const BG_END = { x: 1, y: 1 };

export const GRADIENT_START = { x: 0, y: 0 };
export const GRADIENT_END = { x: 1, y: 0 };

// Olive-tinted shadows
export const SHADOW = {
  card: {
    shadowColor: '#4F5B2A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 5,
  },

  nav: {
    shadowColor: '#4F5B2A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 10,
  },

  header: {
    shadowColor: '#4F5B2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },
};
