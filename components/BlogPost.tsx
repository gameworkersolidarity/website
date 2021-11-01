import { BlogPost } from '../data/types';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { DateTime } from './Date';

export function BlogPostThumbnail({ blog: b }: { blog: BlogPost }) {
  return (
    <Link href={`/analysis/${b.fields.Slug}`} key={b.fields.Slug}>
      <article key={b.id} className='bg-white rounded-lg p-4 space-y-3 glowable cursor-pointer'>
        {!!b.fields.Image?.[0] && (
          <div className='rounded-lg shadow-gwPink'>
            <Image
              layout='responsive'
              src={b.fields.Image[0].thumbnails.full?.url || b.fields.Image[0].url}
              width={b.fields.Image[0].thumbnails.large.width}
              height={b.fields.Image[0].thumbnails.large.height}
            />
          </div>
        )}
        <header className='space-x-4 text-xs font-semibold'>
          <DateTime date={b.fields.Date} />
        </header>
        <h2 className='font-semibold text-3xl leading-tight'>
          {b.fields.Title}
        </h2>
        <p className='text-lg font-light'>
          {b.fields.Summary}
        </p>
      </article>
    </Link>
  )
}