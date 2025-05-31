export interface ProductivityData {
  // timestamp: number; // Unix timestamp in ms
  wpm: number; // Words per minute typing speed
  keystrokesPerMinute: number; // Total key presses per minute (excluding actual keys)
  mouseEventsPerMinute: number; // Mouse clicks/moves/scrolls per minute
  idleSeconds: number; // Seconds since last input event
  // activeApp: string; // Active application name or identifier
  // activeWindowTitle?: string; // Active window title (optional)
  // activeBrowserTabDomain?: string; // Domain of active browser tab (if browser context)
  // pomodoroState?: "working" | "break" | "paused"; // Current Pomodoro timer state
  applicationChangeCount: number; // app/tab changes in the last minute
}

// Map labels to numbers
export enum ProductivityState {
  Productive = 0,
  Regular = 1,
  Distracted = 2,
}

export const labelMapInverse = Object.keys(ProductivityState)
  .filter((key) => isNaN(Number(key))) // keep only the string keys
  .sort(
    (a, b) =>
      ProductivityState[a as keyof typeof ProductivityState] -
      ProductivityState[b as keyof typeof ProductivityState]
  )
  .map((k) => k.toLowerCase());
