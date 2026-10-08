import { useEffect, useLayoutEffect, useRef } from 'react'
import { money, type Line } from './model'

/** Brief feedback on real changes; values and controls update immediately. */
export function useLedgerMotion({ lines, total, receipts, ready, toast }: {
  lines: Line[]; total: number; receipts: number; ready: boolean; toast: object | null
}) {
  const root = useRef<HTMLDivElement>(null)
  const previous = useRef({ lines, total, receipts, ready: false })
  const running = useRef(new Set<Animation>())
  const perElement = useRef(new WeakMap<Element, Animation>())
  const counterValue = useRef(total)
  const counterFrame = useRef<number | null>(null)

  const animate = (element: Element | null | undefined, frames: Keyframe[], duration: number) => {
    if (!element || typeof element.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    perElement.current.get(element)?.cancel()
    const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)' })
    perElement.current.set(element, animation)
    running.current.add(animation)
    const release = () => {
      running.current.delete(animation)
      if (perElement.current.get(element) === animation) perElement.current.delete(element)
    }
    animation.onfinish = release
    animation.oncancel = release
  }

  useLayoutEffect(() => {
    const before = previous.current
    previous.current = { lines, total, receipts, ready }
    // Loading a saved draft should never replay item-added feedback.
    if (!ready || !before.ready || !root.current) {
      counterValue.current = total
      if (counterFrame.current !== null) cancelAnimationFrame(counterFrame.current)
      counterFrame.current = null
      return
    }
    const accent = getComputedStyle(root.current).getPropertyValue('--blue').trim()
    const rows = [...root.current.querySelectorAll<HTMLElement>('.bill-row')]
    for (const line of lines) {
      const old = before.lines.find(item => item.productId === line.productId)
      if (old?.quantity === line.quantity) continue
      const row = rows.find(item => item.dataset.productId === line.productId)
      if (!row) continue
      const background = getComputedStyle(row).backgroundColor
      animate(row, [
        { backgroundColor: `color-mix(in srgb, ${accent} 10%, ${background})`, boxShadow: `inset 3px 0 ${accent}`, offset: 0 },
        { backgroundColor: background, boxShadow: 'inset 0px 0 transparent', offset: 1 },
      ], 440)
      animate(row.querySelector('.bill-qty'), [{ translate: '0 -3px' }, { translate: '0 0' }], 170)
    }
    if (before.total !== total) {
      const totalElement = root.current.querySelector<HTMLElement>('.total-row>strong')
      const amountNode = totalElement?.childNodes[1]
      if (amountNode?.nodeType === Node.TEXT_NODE) {
        if (counterFrame.current !== null) cancelAnimationFrame(counterFrame.current)
        const start = counterValue.current
        const startTime = performance.now()
        const duration = 800
        let lastText = money(start)
        const updateCounter = (time: number) => {
          const progress = Math.min(Math.max((time - startTime) / duration, 0), 1)
          const easedProgress = (1 - Math.cos(Math.PI * progress)) / 2
          const value = start + (total - start) * easedProgress
          // Keep fractional digits steady instead of flashing random cents each frame.
          const displayedValue = progress === 1 ? total : start + Math.trunc((value - start) / 100) * 100
          const text = money(displayedValue)
          if (text !== lastText) {
            amountNode.textContent = text
            lastText = text
          }
          counterValue.current = displayedValue
          if (progress < 1) {
            counterFrame.current = requestAnimationFrame(updateCounter)
          } else {
            amountNode.textContent = money(total)
            counterValue.current = total
            counterFrame.current = null
          }
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          amountNode.textContent = money(total)
          counterValue.current = total
          counterFrame.current = null
        } else {
          // Restore the displayed value before React's new total can flash on screen.
          amountNode.textContent = money(start)
          counterFrame.current = requestAnimationFrame(updateCounter)
        }
      }
    }
    if (receipts > before.receipts) {
      const summary = root.current.querySelector('.today-summary>strong')
      if (summary) animate(summary, [{ color: accent }, { color: getComputedStyle(summary).color }], 550)
    }
  }, [lines, total, receipts, ready])

  useLayoutEffect(() => {
    if (!toast) return
    animate(root.current?.querySelector('.toast'), [{ translate: '0 5px', opacity: .5 }, { translate: '0 0', opacity: 1 }], 170)
  }, [toast])

  useEffect(() => () => {
    running.current.forEach(animation => animation.cancel())
    running.current.clear()
    if (counterFrame.current !== null) cancelAnimationFrame(counterFrame.current)
  }, [])

  return root
}
