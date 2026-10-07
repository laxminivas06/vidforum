"use client"

import { useEffect, useRef } from "react"
import {
  isModifierPressed,
  isTextInputTarget,
  isMac,
} from "@/lib/utils/keyboard"

export interface ShortcutDefinition {
  key: string
  modifier?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  category?: "Global" | "Navigation" | "Modals & Dialogs" | "Forms"
  handler: (e: KeyboardEvent) => void
  allowInInputs?: boolean
  preventDefault?: boolean
}

/**
 * Hook to listen for a single keyboard combination
 */
export function useKeybinding(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: {
    modifier?: boolean
    shift?: boolean
    alt?: boolean
    allowInInputs?: boolean
    preventDefault?: boolean
    enabled?: boolean
  } = {}
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const {
    modifier = false,
    shift = false,
    alt = false,
    allowInInputs = false,
    preventDefault = true,
    enabled = true,
  } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check target input restriction
      if (!allowInInputs && isTextInputTarget(e.target)) {
        return
      }

      // Check modifier key
      if (modifier && !isModifierPressed(e)) {
        return
      }
      if (!modifier && isModifierPressed(e)) {
        return
      }

      // Check Shift key
      if (shift && !e.shiftKey) return

      // Check Alt key
      if (alt && !e.altKey) return
      if (!alt && e.altKey) return

      // Check Key match (case-insensitive for letters)
      const matchesKey =
        e.key.toLowerCase() === key.toLowerCase() ||
        e.code.toLowerCase() === key.toLowerCase()

      if (matchesKey) {
        if (preventDefault) {
          e.preventDefault()
          e.stopPropagation()
        }
        handlerRef.current(e)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, modifier, shift, alt, allowInInputs, preventDefault, enabled])
}

/**
 * Hook to handle Escape key (e.g. for closing modals, slide-overs, popups)
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        handlerRef.current()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enabled])
}

/**
 * Hook to handle Enter or Cmd/Ctrl+Enter submission for forms and modals
 */
export function useSubmitKey(
  handler: (e: KeyboardEvent) => void,
  options: {
    requireModifier?: boolean
    enabled?: boolean
  } = {}
) {
  const { requireModifier = false, enabled = true } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return

      // If user is inside textarea and didn't press Cmd/Ctrl, allow standard new line
      const isTextarea = (e.target as HTMLElement)?.tagName?.toLowerCase() === "textarea"
      if (isTextarea && !isModifierPressed(e)) {
        return
      }

      if (requireModifier && !isModifierPressed(e)) {
        return
      }

      e.preventDefault()
      e.stopPropagation()
      handlerRef.current(e)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [requireModifier, enabled])
}
