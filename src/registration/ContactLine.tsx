import { telHref } from '../config/derived'
import { league } from '../config/league'
import { useLocale } from '../i18n/useLocale'

/**
 * "<lead> at email, phone or phone." / "<lead>: email, teléfono o teléfono."
 * Renders nothing until contact details are configured.
 */
export function ContactLine({ lead }: { lead: string }) {
  const locale = useLocale()
  const { email, phones } = league.contact
  const links = [
    ...(email ? [<a key={email} href={`mailto:${email}`}>{email}</a>] : []),
    ...phones.map((phone) => (
      <a key={phone} href={telHref(phone)}>
        {phone}
      </a>
    )),
  ]
  if (links.length === 0) return null
  const [joiner, or] = locale === 'es' ? [': ', ' o '] : [' at ', ' or ']
  return (
    <p>
      {lead}
      {joiner}
      {links.map((link, i) => (
        <span key={i}>
          {i > 0 && (i === links.length - 1 ? or : ', ')}
          {link}
        </span>
      ))}
      .
    </p>
  )
}
