'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import { EventTimeline } from '../../components/EventTimeline'
import { useMemo } from 'react'
import { isCategory, isCountry, isCompany, isOrganisingGroup } from '@/utils/type-guards'
import { getCountryFlag } from '@/utils/iso'
import { EventCard } from '@/components/EventCard'
import type { Event } from '@/payload-types'
import { LoggedIn, Username } from '@/components/Me'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'

export function EventPage({ initialEvent }: { initialEvent: Event }) {
  if (!initialEvent) notFound()

  // Use the Payload API URL (where the admin panel is hosted)
  const serverURL =
    process.env.NEXT_PUBLIC_PAYLOAD_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    'http://localhost:3000'

  const { data: event } = useLivePreview({
    initialData: initialEvent,
    serverURL,
    depth: 2,
  })

  return (
    <div className="bg-gwBackground" style={{ minHeight: '66vh' }}>
      <div className="max-w-4xl mx-auto py-5 px-4 flex flex-col gap-4">
        <LoggedIn>
          <div className="flex flex-row items-center justify-between gap-4 bg-snot-300 p-4 rounded-lg">
            <div>
              Logged in as <Username />
            </div>
            <Link href={`/admin/collections/events/${event.id}`}>
              <Button>Edit this page</Button>
            </Link>
          </div>
        </LoggedIn>
        <EventCard data={event} withContext displayStandaloneInfo />
      </div>
    </div>
  )
}

// export function EventContent({ initialEvent, isDraftMode }: EventContentProps) {
//   // Use the Payload API URL (where the admin panel is hosted)
//   const serverURL =
//     process.env.NEXT_PUBLIC_PAYLOAD_URL ||
//     process.env.PAYLOAD_PUBLIC_SERVER_URL ||
//     'http://localhost:3000'

//   const { data: event } = useLivePreview({
//     initialData: initialEvent,
//     serverURL,
//     depth: 2,
//   })

//   // Extract related events from the event data
//   const relatedEvents = useMemo(() => {
//     if (!event?.relatedEvents || !Array.isArray(event.relatedEvents)) {
//       return []
//     }

//     const events: Event[] = []
//     for (const relatedEventItem of event.relatedEvents) {
//       if (relatedEventItem?.event) {
//         // Check if the related event is already populated (object) or just an ID
//         if (typeof relatedEventItem.event === 'object' && isEvent(relatedEventItem.event)) {
//           // Already populated, use it directly if it's published (when not in draft mode)
//           events.push(relatedEventItem.event)
//         }
//       }
//     }
//     return events
//   }, [event?.relatedEvents])

//   if (!event) {
//     return null
//   }

//   const formattedDate = event.date ? formatDate(new Date(event.date)) : ''

//   // Extract related entities
//   const countries = Array.isArray(event.countries) ? event.countries.filter(isCountry) : []
//   const categories = Array.isArray(event.categories) ? event.categories.filter(isCategory) : []
//   const companies = Array.isArray(event.companies) ? event.companies.filter(isCompany) : []
//   const organisingGroups = Array.isArray(event.organisingGroups)
//     ? event.organisingGroups.filter(isOrganisingGroup)
//     : []

//   return (
//     <div className="action-page">
//       <article className="action-article">
//         {/* Metadata line */}
//         <div className="action-metadata">
//           {formattedDate && (
//             <time dateTime={event.date} className="action-date">
//               {formattedDate}
//             </time>
//           )}
//           {event.location && <span className="action-metadata-item">{event.location}</span>}
//         </div>

//         {/* Article title */}
//         <h1 className="action-title font-identity">{event.name}</h1>

//         {/* Article content */}
//         {event.description && (
//           <div className="action-content">
//             <LexicalRenderer content={event.description} />
//           </div>
//         )}

//         {/* Have more info section */}
//         <div className="action-more-info">
//           <span>Have more info about this event? </span>
//           <a href="mailto:hello@gameworkersolidarity.com" className="action-more-info-link">
//             Let us know →
//           </a>
//         </div>
//       </article>

//       {/* Related information boxes */}
//       {(countries.length > 0 ||
//         categories.length > 0 ||
//         companies.length > 0 ||
//         organisingGroups.length > 0) && (
//         <div className="action-related-info">
//           {countries.map((country) => {
//             return (
//               <div key={country.id} className="related-info-box">
//                 <div className="related-info-header">
//                   {country.isoA2 && (
//                     <span className="related-info-icon" aria-label={`Flag of ${country.name}`}>
//                       {getCountryFlag(country.isoA2)}
//                     </span>
//                   )}
//                   <span className="related-info-title">{country.name}</span>
//                 </div>
//                 <div className="related-info-type">Country</div>
//                 {country.slug && (
//                   <Link href={`/countries/${country.slug}`} className="related-info-link">
//                     Learn more →
//                   </Link>
//                 )}
//               </div>
//             )
//           })}

//           {categories.map((category) => {
//             return (
//               <div key={category.id} className="related-info-box">
//                 <div className="related-info-header">
//                   {category.emoji && <span className="related-info-icon">{category.emoji}</span>}
//                   <span className="related-info-title">{category.name}</span>
//                 </div>
//                 <div className="related-info-type">Category</div>
//                 {category.slug && (
//                   <Link href={`/categories/${category.slug}`} className="related-info-link">
//                     Learn more →
//                   </Link>
//                 )}
//               </div>
//             )
//           })}

//           {organisingGroups.map((group) => (
//             <div key={group.id} className="related-info-box">
//               <div className="related-info-title">
//                 {typeof group === 'object' && 'fullName' in group
//                   ? group.fullName || group.name
//                   : group.name}
//               </div>
//               <div className="related-info-type">Organising group</div>
//               {group.slug && (
//                 <Link href={`/organising-groups/${group.slug}`} className="related-info-link">
//                   Learn more →
//                 </Link>
//               )}
//             </div>
//           ))}

//           {companies.map((company) => {
//             return (
//               <div key={company.id} className="related-info-box">
//                 <div className="related-info-title">{company.name}</div>
//                 <div className="related-info-type">Company</div>
//                 {company.slug && (
//                   <Link href={`/companies/${company.slug}`} className="related-info-link">
//                     Learn more →
//                   </Link>
//                 )}
//               </div>
//             )
//           })}
//         </div>
//       )}

//       {/* Related events section */}
//       {relatedEvents.length > 0 && (
//         <div style={{ marginTop: '3rem' }}>
//           <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Related Events</h2>
//           <EventTimeline
//             events={relatedEvents.sort(
//               (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
//             )}
//           />
//         </div>
//       )}
//     </div>
//   )
// }
