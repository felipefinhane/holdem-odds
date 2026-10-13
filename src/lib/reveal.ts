export const DOUBLE_TAP_MS = 400
export const LONG_PRESS_MS = 500

// Segundo toque dentro da janela do toque duplo?
export const isDoubleTap = (previousTap: number, now: number) => previousTap > 0 && now - previousTap <= DOUBLE_TAP_MS
