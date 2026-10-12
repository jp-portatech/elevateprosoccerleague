import { formatIsoDate } from '../config/derived'
import { ageOn } from './model'

export const money = (cents: number | null, currency: string | null = 'usd') =>
  cents === null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency ?? 'usd').toUpperCase() }).format(cents / 100)

export const shortDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso)) : '—'

/** "Mar 4, 2017 · age 9" */
export function birthLabel(dateOfBirth: string | undefined) {
  if (!dateOfBirth) return '—'
  const age = ageOn(dateOfBirth)
  return `${formatIsoDate(dateOfBirth, 'en', { month: 'short', day: 'numeric', year: 'numeric' })}${age !== null ? ` · age ${age}` : ''}`
}

/** Downloads rows as a spreadsheet-friendly CSV file. */
export function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
