import { telHref } from '../config/derived'
import { league } from '../config/league'

/** "<lead> at email or phone." — renders nothing until contact details are configured. */
export function ContactLine({ lead }: { lead: string }) {
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
  return (
    <p>
      {lead} at{' '}
      {links.map((link, i) => (
        <span key={i}>
          {i > 0 && (i === links.length - 1 ? ' or ' : ', ')}
          {link}
        </span>
      ))}
      .
    </p>
  )
}
