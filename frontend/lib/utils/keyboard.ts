/**
 * Cross-platform Keyboard Utilities for VID Platform
 * Handles Mac (Cmd / ⌘) and Windows/Linux (Ctrl) compatibility seamlessly.
 */

export const isMac = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false
  }
  return (
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ||
    (navigator as any).userAgentData?.platform === "macOS" ||
    navigator.platform?.toLowerCase().includes("mac")
  )
}

/**
 * Returns the primary modifier key label ("⌘" for Mac, "Ctrl" for Windows/Linux)
 */
export const getModifierLabel = (): string => {
  return isMac() ? "⌘" : "Ctrl"
}

/**
 * Checks if the primary platform modifier key is pressed.
 * Supports both e.metaKey (Mac Command) and e.ctrlKey (Windows/Linux Control),
 * as well as either modifier for maximum user comfort.
 */
export const isModifierPressed = (
  e: KeyboardEvent | React.KeyboardEvent
): boolean => {
  return e.metaKey || e.ctrlKey
}

/**
 * Formats a key combination for display with proper Mac/Windows symbols.
 * Example: formatShortcut("K", { modifier: true }) => "⌘K" on Mac, "Ctrl+K" on Windows
 */
export const formatShortcut = (
  key: string,
  options: {
    modifier?: boolean
    shift?: boolean
    alt?: boolean
  } = {}
): string => {
  const mac = isMac()
  const parts: string[] = []

  if (options.modifier) {
    parts.push(mac ? "⌘" : "Ctrl")
  }
  if (options.alt) {
    parts.push(mac ? "⌥" : "Alt")
  }
  if (options.shift) {
    parts.push(mac ? "⇧" : "Shift")
  }

  // Format special keys
  let keyLabel = key
  if (key === "Enter") keyLabel = mac ? "↵" : "Enter"
  if (key === "Escape") keyLabel = "Esc"
  if (key === "ArrowUp") keyLabel = "↑"
  if (key === "ArrowDown") keyLabel = "↓"
  if (key === "Backspace") keyLabel = mac ? "⌫" : "Backspace"

  parts.push(keyLabel)
  return mac ? parts.join("") : parts.join("+")
}

/**
 * Determines whether the event target is an interactive text input
 * (where typing single letters should not trigger global navigation shortcuts)
 */
export const isTextInputTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  if (tagName === "input") {
    const inputType = (target as HTMLInputElement).type.toLowerCase()
    // Non-text inputs (checkbox, radio, button) can still accept shortcuts
    return !["checkbox", "radio", "button", "submit", "reset"].includes(inputType)
  }
  if (tagName === "textarea") return true
  if (tagName === "select") return true
  if (target.isContentEditable) return true
  return false
}
