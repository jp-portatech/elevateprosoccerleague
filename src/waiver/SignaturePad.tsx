import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import type { Signature } from './waiverForm'

interface SignaturePadProps {
  /** Id of the group, so the error summary can move focus here. */
  id: string
  label: string
  /** e.g. "Only needed for participants under 18." */
  note?: string
  required: boolean
  value: Signature | null
  error?: string
  onChange: (value: Signature | null) => void
}

type Point = { x: number; y: number }

const INK = '#0b1b33'
/** A stray tap or tiny mark doesn't count as a signature (path length in CSS pixels). */
const MIN_INK = 20
/** Saved drawings are scaled to this width, which keeps them small. */
const EXPORT_WIDTH = 600

/**
 * Draw a signature with a finger, stylus or mouse, or type your full name instead (also the
 * keyboard and screen-reader option). Points are kept as fractions of the pad's size, so the
 * drawing survives the phone turning sideways.
 */
export function SignaturePad({ id, label, note, required, value, error, onChange }: SignaturePadProps) {
  const uid = useId()
  const helpId = `${uid}-help`
  const errorId = error ? `${uid}-error` : undefined
  const [mode, setMode] = useState<'draw' | 'type'>(value?.kind === 'typed' ? 'type' : 'draw')
  const [hasInk, setHasInk] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Point[][]>([])
  const drawing = useRef(false)

  const paint = useCallback((canvas: HTMLCanvasElement, width: number, height: number, scale: number) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = INK
    ctx.fillStyle = INK
    ctx.lineWidth = Math.max(2, width / 260)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of strokes.current) {
      const pts = stroke.map((p) => ({ x: p.x * width, y: p.y * height }))
      if (pts.length === 1) {
        ctx.beginPath()
        ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      // Smooth curve through the midpoints between samples.
      for (let i = 1; i < pts.length - 1; i++) {
        const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 }
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y)
      }
      const last = pts[pts.length - 1]
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    }
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
    }
    paint(canvas, width, height, ratio)
  }, [paint])

  useEffect(() => {
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    redraw()
    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [mode, redraw])

  // The form was reset (e.g. "Sign a waiver for another player"): wipe the drawing too.
  useEffect(() => {
    if (value === null && strokes.current.length > 0 && !drawing.current) {
      strokes.current = []
      setHasInk(false)
      redraw()
    }
  }, [value, redraw])

  const point = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const box = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    }
  }

  const inkLength = () => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const { width, height } = canvas.getBoundingClientRect()
    let total = 0
    for (const stroke of strokes.current) {
      for (let i = 1; i < stroke.length; i++) {
        total += Math.hypot((stroke[i].x - stroke[i - 1].x) * width, (stroke[i].y - stroke[i - 1].y) * height)
      }
    }
    return total
  }

  const exportImage = () => {
    const canvas = canvasRef.current!
    const { width, height } = canvas.getBoundingClientRect()
    const out = document.createElement('canvas')
    out.width = EXPORT_WIDTH
    out.height = Math.round((EXPORT_WIDTH * height) / width)
    paint(out, width, height, EXPORT_WIDTH / width)
    return out.toDataURL('image/png')
  }

  const finishStroke = () => {
    if (!drawing.current) return
    drawing.current = false
    const enough = inkLength() >= MIN_INK
    setHasInk(strokes.current.length > 0)
    onChange(enough ? { kind: 'drawn', image: exportImage() } : null)
  }

  const clear = () => {
    strokes.current = []
    setHasInk(false)
    redraw()
    onChange(null)
  }

  const switchTo = (next: 'draw' | 'type') => {
    setMode(next)
    strokes.current = []
    setHasInk(false)
    onChange(null)
  }

  return (
    <fieldset
      className={['signature', error && 'signature--error'].filter(Boolean).join(' ')}
      id={id}
      tabIndex={-1}
      aria-describedby={[helpId, errorId].filter(Boolean).join(' ')}
    >
      <legend className="field__label">
        {label}
        {!required && <span className="field__optional"> (optional)</span>}
      </legend>
      <p className="field__hint" id={helpId}>
        {note ? `${note} ` : ''}
        {mode === 'draw'
          ? 'Sign in the box with your finger, a stylus or your mouse.'
          : 'Type your full name. It counts as your signature.'}
      </p>
      {error && (
        <p className="field__error" id={errorId}>
          <span className="visually-hidden">Error: </span>
          {error}
        </p>
      )}

      {mode === 'draw' ? (
        <div className="signature__pad">
          {/* Drawing is pointer-only; keyboard and screen-reader users sign by typing their name. */}
          <canvas
            ref={canvasRef}
            className="signature__canvas"
            aria-hidden="true"
            onPointerDown={(e) => {
              e.preventDefault()
              e.currentTarget.setPointerCapture(e.pointerId)
              drawing.current = true
              strokes.current.push([point(e)])
              redraw()
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return
              const stroke = strokes.current[strokes.current.length - 1]
              const events = e.nativeEvent.getCoalescedEvents?.() ?? []
              if (events.length > 1) {
                const box = e.currentTarget.getBoundingClientRect()
                for (const c of events) {
                  stroke.push({
                    x: Math.min(1, Math.max(0, (c.clientX - box.left) / box.width)),
                    y: Math.min(1, Math.max(0, (c.clientY - box.top) / box.height)),
                  })
                }
              } else {
                stroke.push(point(e))
              }
              redraw()
            }}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
          />
          {!hasInk && (
            <span className="signature__placeholder" aria-hidden="true">
              Sign here
            </span>
          )}
          <span className="signature__line" aria-hidden="true" />
        </div>
      ) : (
        <input
          className="field__control signature__typed"
          type="text"
          aria-label={`${label}: type your full name`}
          autoComplete="name"
          maxLength={100}
          value={value?.kind === 'typed' ? value.name : ''}
          onChange={(e) => onChange(e.target.value.trim() ? { kind: 'typed', name: e.target.value } : null)}
        />
      )}

      <p className="visually-hidden" aria-live="polite">
        {mode === 'draw' && value ? `${label} added.` : ''}
      </p>
      <div className="signature__actions">
        {mode === 'draw' && (
          <button type="button" className="signature__action" onClick={clear} disabled={!hasInk}>
            Clear
          </button>
        )}
        <button type="button" className="signature__action" onClick={() => switchTo(mode === 'draw' ? 'type' : 'draw')}>
          {mode === 'draw' ? 'Type my name instead' : 'Draw my signature instead'}
        </button>
      </div>
    </fieldset>
  )
}
