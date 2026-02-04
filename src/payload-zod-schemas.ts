/**
 * This file was automatically generated from payload-types.ts
 * DO NOT MODIFY IT BY HAND. Instead, modify the generator script and re-run it.
 *
 * To regenerate: pnpm tsx scripts/generate-zod-schemas.ts
 */

import {
  User,
  Media,
  StaticPage,
  BlogPost,
  Country,
  Company,
  Category,
  OrganisingGroup,
  Campaign,
  Action,
} from '@/payload-types'
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  email: z.string(),
  resetPasswordToken: z.string().optional().nullable(),
  resetPasswordExpiration: z.string().optional().nullable(),
  salt: z.string().optional().nullable(),
  hash: z.string().optional().nullable(),
  loginAttempts: z.number().optional().nullable(),
  lockUntil: z.string().optional().nullable(),
  sessions: z
    .array(
      z.object({
        id: z.string(),
        createdAt: z.string().optional().nullable(),
        expiresAt: z.string(),
      }),
    )
    .optional()
    .nullable(),
  password: z.string().optional().nullable(),
})

export const MediaSchema = z.object({
  id: z.string(),
  alt: z.string().optional().nullable(),
  cloudinary: z
    .object({
      public_id: z.string().optional().nullable(),
      resource_type: z.string().optional().nullable(),
      format: z.string().optional().nullable(),
      secure_url: z.string().optional().nullable(),
      bytes: z.number().optional().nullable(),
      created_at: z.string().optional().nullable(),
      version: z.string().optional().nullable(),
      version_id: z.string().optional().nullable(),
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      duration: z.number().optional().nullable(),
      pages: z.number().optional().nullable(),
      selected_page: z.number().optional().nullable(),
      thumbnail_url: z.string().optional().nullable(),
    })
    .optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().optional().nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  url: z.string().optional().nullable(),
  thumbnailURL: z.string().optional().nullable(),
  filename: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  filesize: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  focalX: z.number().optional().nullable(),
  focalY: z.number().optional().nullable(),
})

export const StaticPageSchema = z.object({
  id: z.string(),
  generateSlug: z.boolean().optional().nullable(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().optional().nullable(),
  body: z.record(z.string(), z.unknown()).and(
    z.object({
      root: z.object({
        type: z.string(),
        children: z.array(
          z.record(z.string(), z.unknown()).and(
            z.object({
              type: z.any(),
              version: z.number(),
            }),
          ),
        ),
        direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
        format: z.union([
          z.literal('left'),
          z.literal('start'),
          z.literal('center'),
          z.literal('right'),
          z.literal('end'),
          z.literal('justify'),
          z.literal(''),
        ]),
        indent: z.number(),
        version: z.number(),
      }),
    }),
  ),
  path: z.string().optional(),
  url: z.string().optional(),
  adminPath: z.string().optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().optional().nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
})

export const BlogPostSchema = z.object({
  id: z.string(),
  adminPath: z.string().optional(),
  date: z.string(),
  airtableId: z.string().optional().nullable(),
  generateSlug: z.boolean().optional().nullable(),
  slug: z.string(),
  title: z.string(),
  byline: z.string().optional().nullable(),
  image: z.union([z.string().nullable(), MediaSchema]).optional(),
  body: z.record(z.string(), z.unknown()).and(
    z.object({
      root: z.object({
        type: z.string(),
        children: z.array(
          z.record(z.string(), z.unknown()).and(
            z.object({
              type: z.any(),
              version: z.number(),
            }),
          ),
        ),
        direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
        format: z.union([
          z.literal('left'),
          z.literal('start'),
          z.literal('center'),
          z.literal('right'),
          z.literal('end'),
          z.literal('justify'),
          z.literal(''),
        ]),
        indent: z.number(),
        version: z.number(),
      }),
    }),
  ),
  path: z.string().optional(),
  url: z.string().optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().optional().nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
})

export const CountrySchema = z.object({
  id: z.string(),
  airtableId: z.string().optional().nullable(),
  generateSlug: z.boolean().optional().nullable(),
  slug: z.string(),
  name: z.string(),
  description: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        root: z.object({
          type: z.string(),
          children: z.array(
            z.record(z.string(), z.unknown()).and(
              z.object({
                type: z.any(),
                version: z.number(),
              }),
            ),
          ),
          direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
          format: z.union([
            z.literal('left'),
            z.literal('start'),
            z.literal('center'),
            z.literal('right'),
            z.literal('end'),
            z.literal('justify'),
            z.literal(''),
          ]),
          indent: z.number(),
          version: z.number(),
        }),
      }),
    )
    .optional()
    .nullable(),
  featuredImage: z.union([z.string().nullable(), MediaSchema]).optional(),
  isoA2: z.string(),
  emoji: z.string().optional(),
  bbox: z
    .union([
      z.record(z.string(), z.unknown()),
      z.array(z.unknown()),
      z.string(),
      z.number(),
      z.boolean(),
    ])
    .optional()
    .nullable(),
  isoA3: z.string().optional(),
  coordinates: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    )
    .optional(),
  path: z.string().optional(),
  url: z.string().optional(),
  adminPath: z.string().optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().optional().nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
})

export const HeaderSchema = z.object({
  id: z.string(),
  navigation: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
        id: z.string().optional().nullable(),
      }),
    )
    .optional()
    .nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  updatedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})

export const FooterSchema = z.object({
  id: z.string(),
  navigation: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
        id: z.string().optional().nullable(),
      }),
    )
    .optional()
    .nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  updatedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})

export const StartOrganisingSchema = z.object({
  id: z.string(),
  description: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        root: z.object({
          type: z.string(),
          children: z.array(
            z.record(z.string(), z.unknown()).and(
              z.object({
                type: z.any(),
                version: z.number(),
              }),
            ),
          ),
          direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
          format: z.union([
            z.literal('left'),
            z.literal('start'),
            z.literal('center'),
            z.literal('right'),
            z.literal('end'),
            z.literal('justify'),
            z.literal(''),
          ]),
          indent: z.number(),
          version: z.number(),
        }),
      }),
    )
    .optional()
    .nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  updatedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})

export const AboutPageSchema = z.object({
  id: z.string(),
  description: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        root: z.object({
          type: z.string(),
          children: z.array(
            z.record(z.string(), z.unknown()).and(
              z.object({
                type: z.any(),
                version: z.number(),
              }),
            ),
          ),
          direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
          format: z.union([
            z.literal('left'),
            z.literal('start'),
            z.literal('center'),
            z.literal('right'),
            z.literal('end'),
            z.literal('justify'),
            z.literal(''),
          ]),
          indent: z.number(),
          version: z.number(),
        }),
      }),
    )
    .optional()
    .nullable(),
  credits: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        root: z.object({
          type: z.string(),
          children: z.array(
            z.record(z.string(), z.unknown()).and(
              z.object({
                type: z.any(),
                version: z.number(),
              }),
            ),
          ),
          direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
          format: z.union([
            z.literal('left'),
            z.literal('start'),
            z.literal('center'),
            z.literal('right'),
            z.literal('end'),
            z.literal('justify'),
            z.literal(''),
          ]),
          indent: z.number(),
          version: z.number(),
        }),
      }),
    )
    .optional()
    .nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  updatedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})

export const CampaignsPageSchema = z.object({
  id: z.string(),
  description: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        root: z.object({
          type: z.string(),
          children: z.array(
            z.record(z.string(), z.unknown()).and(
              z.object({
                type: z.any(),
                version: z.number(),
              }),
            ),
          ),
          direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
          format: z.union([
            z.literal('left'),
            z.literal('start'),
            z.literal('center'),
            z.literal('right'),
            z.literal('end'),
            z.literal('justify'),
            z.literal(''),
          ]),
          indent: z.number(),
          version: z.number(),
        }),
      }),
    )
    .optional()
    .nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  updatedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})

export const DataPageSchema = z.object({
  id: z.string(),
  description: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        root: z.object({
          type: z.string(),
          children: z.array(
            z.record(z.string(), z.unknown()).and(
              z.object({
                type: z.any(),
                version: z.number(),
              }),
            ),
          ),
          direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
          format: z.union([
            z.literal('left'),
            z.literal('start'),
            z.literal('center'),
            z.literal('right'),
            z.literal('end'),
            z.literal('justify'),
            z.literal(''),
          ]),
          indent: z.number(),
          version: z.number(),
        }),
      }),
    )
    .optional()
    .nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  updatedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})

export const ActionSubmissionPageSchema = z.object({
  id: z.string(),
  title: z.string().optional().nullable(),
  description: z
    .record(z.string(), z.unknown())
    .and(
      z.object({
        root: z.object({
          type: z.string(),
          children: z.array(
            z.record(z.string(), z.unknown()).and(
              z.object({
                type: z.any(),
                version: z.number(),
              }),
            ),
          ),
          direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
          format: z.union([
            z.literal('left'),
            z.literal('start'),
            z.literal('center'),
            z.literal('right'),
            z.literal('end'),
            z.literal('justify'),
            z.literal(''),
          ]),
          indent: z.number(),
          version: z.number(),
        }),
      }),
    )
    .optional()
    .nullable(),
  _status: z
    .union([z.literal('draft'), z.literal('published')])
    .optional()
    .nullable(),
  updatedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})

export const CompanySchema: z.ZodSchema<Company> = z.lazy(() =>
  z.object({
    id: z.string(),
    airtableId: z.string().optional().nullable(),
    generateSlug: z.boolean().optional().nullable(),
    slug: z.string(),
    name: z.string(),
    description: z
      .record(z.string(), z.unknown())
      .and(
        z.object({
          root: z.object({
            type: z.string(),
            children: z.array(
              z.record(z.string(), z.unknown()).and(
                z.object({
                  type: z.any(),
                  version: z.number(),
                }),
              ),
            ),
            direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
            format: z.union([
              z.literal('left'),
              z.literal('start'),
              z.literal('center'),
              z.literal('right'),
              z.literal('end'),
              z.literal('justify'),
              z.literal(''),
            ]),
            indent: z.number(),
            version: z.number(),
          }),
        }),
      )
      .optional()
      .nullable(),
    featuredImage: z.union([z.string().nullable(), MediaSchema]).optional(),
    countries: z
      .array(z.union([z.string(), CountrySchema]))
      .optional()
      .nullable(),
    actions: z
      .object({
        docs: z.array(z.union([z.string(), ActionSchema])).optional(),
        hasNextPage: z.boolean().optional(),
        totalDocs: z.number().optional(),
      })
      .optional(),
    path: z.string().optional(),
    url: z.string().optional(),
    parents: z
      .array(
        z.object({
          doc: z.union([z.string().nullable(), CompanySchema]).optional(),
          url: z.string().optional().nullable(),
          label: z.string().optional().nullable(),
          id: z.string().optional().nullable(),
        }),
      )
      .optional()
      .nullable(),
    adminPath: z.string().optional(),
    parent: z.union([z.string().nullable(), CompanySchema]).optional(),
    updatedAt: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().optional().nullable(),
    _status: z
      .union([z.literal('draft'), z.literal('published')])
      .optional()
      .nullable(),
  }),
)

export const ActionSchema: z.ZodSchema<Action> = z.lazy(() =>
  z.object({
    id: z.string(),
    generateSlug: z.boolean().optional().nullable(),
    slug: z.string(),
    name: z.string(),
    airtableId: z.string().optional().nullable(),
    description: z
      .record(z.string(), z.unknown())
      .and(
        z.object({
          root: z.object({
            type: z.string(),
            children: z.array(
              z.record(z.string(), z.unknown()).and(
                z.object({
                  type: z.any(),
                  version: z.number(),
                }),
              ),
            ),
            direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
            format: z.union([
              z.literal('left'),
              z.literal('start'),
              z.literal('center'),
              z.literal('right'),
              z.literal('end'),
              z.literal('justify'),
              z.literal(''),
            ]),
            indent: z.number(),
            version: z.number(),
          }),
        }),
      )
      .optional()
      .nullable(),
    source: z.string().optional().nullable(),
    date: z.string(),
    endDate: z.string().optional().nullable(),
    categories: z
      .array(z.union([z.string(), CategorySchema]))
      .optional()
      .nullable(),
    headcount: z.number().optional().nullable(),
    initiator: z
      .union([z.literal('WORKER_LED'), z.literal('BOSS_LED'), z.literal('OTHER')])
      .optional()
      .nullable(),
    link: z.string().optional().nullable(),
    documents: z
      .array(z.union([z.string(), MediaSchema]))
      .optional()
      .nullable(),
    location: z.string().optional().nullable(),
    countries: z
      .array(z.union([z.string(), CountrySchema]))
      .optional()
      .nullable(),
    coordinates: z
      .record(z.string(), z.unknown())
      .and(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
      )
      .optional(),
    companies: z
      .array(z.union([z.string(), CompanySchema]))
      .optional()
      .nullable(),
    organisingGroups: z
      .array(z.union([z.string(), OrganisingGroupSchema]))
      .optional()
      .nullable(),
    campaigns: z
      .object({
        docs: z.array(z.union([z.string(), CampaignSchema])).optional(),
        hasNextPage: z.boolean().optional(),
        totalDocs: z.number().optional(),
      })
      .optional(),
    relatedActions: z
      .array(
        z.object({
          action: z.union([z.string(), ActionSchema]),
          connectionType: z.union([z.literal('DIRECT'), z.literal('INDIRECT')]),
          description: z.string(),
          id: z.string().optional().nullable(),
        }),
      )
      .optional()
      .nullable(),
    path: z.string().optional(),
    url: z.string().optional(),
    adminPath: z.string().optional(),
    featured: z.boolean().optional().nullable(),
    submissionContactDetails: z.string().optional().nullable(),
    consent: z.boolean().optional().nullable(),
    updatedAt: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().optional().nullable(),
    _status: z
      .union([z.literal('draft'), z.literal('published')])
      .optional()
      .nullable(),
  }),
)

export const CategorySchema: z.ZodSchema<Category> = z.lazy(() =>
  z.object({
    id: z.string(),
    airtableId: z.string().optional().nullable(),
    generateSlug: z.boolean().optional().nullable(),
    slug: z.string(),
    name: z.string(),
    emoji: z.string().optional().nullable(),
    description: z
      .record(z.string(), z.unknown())
      .and(
        z.object({
          root: z.object({
            type: z.string(),
            children: z.array(
              z.record(z.string(), z.unknown()).and(
                z.object({
                  type: z.any(),
                  version: z.number(),
                }),
              ),
            ),
            direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
            format: z.union([
              z.literal('left'),
              z.literal('start'),
              z.literal('center'),
              z.literal('right'),
              z.literal('end'),
              z.literal('justify'),
              z.literal(''),
            ]),
            indent: z.number(),
            version: z.number(),
          }),
        }),
      )
      .optional()
      .nullable(),
    featuredImage: z.union([z.string().nullable(), MediaSchema]).optional(),
    actions: z
      .object({
        docs: z.array(z.union([z.string(), ActionSchema])).optional(),
        hasNextPage: z.boolean().optional(),
        totalDocs: z.number().optional(),
      })
      .optional(),
    path: z.string().optional(),
    url: z.string().optional(),
    adminPath: z.string().optional(),
    updatedAt: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().optional().nullable(),
    _status: z
      .union([z.literal('draft'), z.literal('published')])
      .optional()
      .nullable(),
  }),
)

export const OrganisingGroupSchema: z.ZodSchema<OrganisingGroup> = z.lazy(() =>
  z.object({
    id: z.string(),
    airtableId: z.string().optional().nullable(),
    generateSlug: z.boolean().optional().nullable(),
    slug: z.string(),
    name: z.string(),
    description: z
      .record(z.string(), z.unknown())
      .and(
        z.object({
          root: z.object({
            type: z.string(),
            children: z.array(
              z.record(z.string(), z.unknown()).and(
                z.object({
                  type: z.any(),
                  version: z.number(),
                }),
              ),
            ),
            direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
            format: z.union([
              z.literal('left'),
              z.literal('start'),
              z.literal('center'),
              z.literal('right'),
              z.literal('end'),
              z.literal('justify'),
              z.literal(''),
            ]),
            indent: z.number(),
            version: z.number(),
          }),
        }),
      )
      .optional()
      .nullable(),
    featuredImage: z.union([z.string().nullable(), MediaSchema]).optional(),
    logo: z.union([z.string().nullable(), MediaSchema]).optional(),
    fullName: z.string().optional().nullable(),
    countries: z
      .array(z.union([z.string(), CountrySchema]))
      .optional()
      .nullable(),
    companies: z
      .array(z.union([z.string(), CompanySchema]))
      .optional()
      .nullable(),
    parents: z
      .array(
        z.object({
          doc: z.union([z.string().nullable(), OrganisingGroupSchema]).optional(),
          url: z.string().optional().nullable(),
          label: z.string().optional().nullable(),
          id: z.string().optional().nullable(),
        }),
      )
      .optional()
      .nullable(),
    isUnion: z.boolean().optional().nullable(),
    highlighted: z.boolean().optional().nullable(),
    actions: z
      .object({
        docs: z.array(z.union([z.string(), ActionSchema])).optional(),
        hasNextPage: z.boolean().optional(),
        totalDocs: z.number().optional(),
      })
      .optional(),
    website: z.string().optional().nullable(),
    webshiteHostname: z.string().optional().nullable(),
    bluesky: z.string().optional().nullable(),
    blueskyHandle: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
    twitterHandle: z.string().optional().nullable(),
    path: z.string().optional(),
    url: z.string().optional(),
    adminPath: z.string().optional(),
    parent: z.union([z.string().nullable(), OrganisingGroupSchema]).optional(),
    updatedAt: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().optional().nullable(),
    _status: z
      .union([z.literal('draft'), z.literal('published')])
      .optional()
      .nullable(),
  }),
)

export const CampaignSchema: z.ZodSchema<Campaign> = z.lazy(() =>
  z.object({
    id: z.string(),
    generateSlug: z.boolean().optional().nullable(),
    slug: z.string(),
    name: z.string(),
    featuredImage: z.union([z.string().nullable(), MediaSchema]).optional(),
    description: z
      .record(z.string(), z.unknown())
      .and(
        z.object({
          root: z.object({
            type: z.string(),
            children: z.array(
              z.record(z.string(), z.unknown()).and(
                z.object({
                  type: z.any(),
                  version: z.number(),
                }),
              ),
            ),
            direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
            format: z.union([
              z.literal('left'),
              z.literal('start'),
              z.literal('center'),
              z.literal('right'),
              z.literal('end'),
              z.literal('justify'),
              z.literal(''),
            ]),
            indent: z.number(),
            version: z.number(),
          }),
        }),
      )
      .optional()
      .nullable(),
    emoji: z.string().optional().nullable(),
    actions: z
      .array(z.union([z.string(), ActionSchema]))
      .optional()
      .nullable(),
    highlightedActionAttribute: z
      .union([
        z.literal('companies'),
        z.literal('countries'),
        z.literal('organisingGroups'),
        z.literal('categories'),
        z.literal('headcount'),
        z.literal('location'),
        z.literal('name'),
      ])
      .optional()
      .nullable(),
    path: z.string().optional(),
    url: z.string().optional(),
    adminPath: z.string().optional(),
    apiPath: z.string().optional(),
    collectionSlug: z.string().optional(),
    updatedAt: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().optional().nullable(),
    _status: z
      .union([z.literal('draft'), z.literal('published')])
      .optional()
      .nullable(),
  }),
)
