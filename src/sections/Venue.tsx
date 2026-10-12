import { Icon } from '../components/Icon'
import { PartnerLogo } from '../components/PartnerLogo'
import { Picture } from '../components/Picture'
import { SectionHeading } from '../components/SectionHeading'
import { venueAddressLines, venueLocation } from '../config/derived'
import { league } from '../config/league'
import { images } from '../content/images'
import './Venue.css'

const { venue } = league

export function Venue() {
  return (
    <section className="section venue section--rule" id="venue" aria-labelledby="venue-title">
      <div className="container venue__grid">
        <div className="venue__intro">
          <SectionHeading id="venue-title" eyebrow="Venue">
            Your Sunday soccer home.
          </SectionHeading>

          <div className="venue__place">
            {venue.partnerLabel ? (
              <PartnerLogo className="venue__partner-logo" sizes="64px" lazy />
            ) : (
              <Icon name="pin" className="venue__pin" />
            )}
            <div>
              {venue.partnerLabel && <p className="venue__partner-label">{venue.partnerLabel}</p>}
              <h3 className="label venue__name">{venue.name}</h3>
              {venueAddressLines ? (
                <address className="venue__address">
                  {venueAddressLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              ) : (
                <p className="venue__city">{venueLocation}</p>
              )}
            </div>
          </div>

          {venue.directionsUrl && (
            <a className="btn btn--primary btn--sm" href={venue.directionsUrl} target="_blank" rel="noopener noreferrer">
              Get directions<span className="visually-hidden"> (opens in a new tab)</span>
              <Icon name="arrow" className="btn__arrow" />
            </a>
          )}
        </div>

        {/* Illustrative image only — swap in an authentic Axe House Sports photo in content/images.ts */}
        <figure className="venue__figure">
          <Picture image={images.venue} className="venue__img" sizes="(min-width: 1024px) 700px, 100vw" />
          <figcaption className="venue__caption">Illustrative indoor facility image — not Axe House Sports</figcaption>
        </figure>

        {venue.amenities.length > 0 && (
          <div className="venue__amenities">
            <h3 className="venue__amenities-title">At the facility</h3>
            <ul className="checklist venue__amenity-list">
              {venue.amenities.map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
