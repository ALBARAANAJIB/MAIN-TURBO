
import * as React from "react"

export type ToastActionElement = React.ReactElement

export type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toasts = new Map<string, ToasterToast>()

const listeners = new Set<(toasts: ToasterToast[]) => void>()

function emitChange() {
  listeners.forEach((listener) => {
    listener(Array.from(toasts.values()))
  })
}

function addToast(toast: ToasterToast) {
  toasts.set(toast.id, {
    ...toast,
    id: toast.id || genId(),
    title: toast.title,
    description: toast.description,
    action: toast.action,
  })
  emitChange()
}

function dismissToast(toastId: string) {
  toasts.delete(toastId)
  emitChange()
}

export function useToast() {
  const [mounted, setMounted] = React.useState(false)
  const [state, setState] = React.useState<ToasterToast[]>([])

  React.useEffect(() => {
    if (mounted) return

    setMounted(true)
    const listener = (items: ToasterToast[]) => {
      setState(items)
    }

    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [mounted])

  return {
    toasts: state,
    toast: (props: ToastProps) => {
      const id = genId()
      const newToast = { ...props, id }
      addToast(newToast)
      return newToast
    },
    dismiss: (toastId: string) => dismissToast(toastId),
  }
}

export const toast = {
  dismiss: dismissToast,
  toast: (props: ToastProps) => {
    const id = genId()
    const newToast = { ...props, id }
    addToast(newToast)
    return newToast
  },
}

