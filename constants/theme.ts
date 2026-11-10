export const GRADIENT = ['#329cda', '#b74b81', '#c90072'] as const;
// Pastel screen background: pink -> lavender -> aqua
export const BG_GRADIENT = ['#e86dfa', '#f880c0', '#e86dfa'] as const;
export const BG_START = { x: 0, y: 0 };
export const BG_END = { x: 1, y: 1 };

export const GRADIENT_START = { x: 0, y: 0 };
export const GRADIENT_END = { x: 1, y: 0 };

// Tinted "back shadow" used under every card, container and navigation bar.
export const SHADOW = {
  card: {
    shadowColor: '#2400FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  nav: {
    shadowColor: '#2400FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 14,
  },
  header: {
    shadowColor: '#2400FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
};