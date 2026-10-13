import { createContext, useContext } from 'react'

export interface InquiryApi {
  /** The page's one call-to-action label. */
  label: string
  /** Opens the page's information-request dialog; focus returns to `opener` on close. */
  open: (opener: HTMLElement) => void
}

export const InquiryContext = createContext<InquiryApi | null>(null)

export function useInquiry(): InquiryApi {
  const api = useContext(InquiryContext)
  if (!api) throw new Error('useInquiry must be used inside <LandingShell>')
  return api
}
