// Generated by ts-to-zod
import { z } from "zod";

export const baseRecordSchema = z.object({
  id: z.string(),
  createdTime: z.string(),
});

export const baseRecordWithSyncedCDNMapSchema = baseRecordSchema.extend({
  fields: z.object({
    cdn_urls: z.string().optional(),
  }),
});

export const thumbnailSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
});

export const countryEmojiSchema = z.object({
  code: z.string(),
  unicode: z.string(),
  name: z.string(),
  emoji: z.string(),
});

export const addressSchema = z.object({
  continent: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  region: z.string().optional(),
  state: z.string().optional(),
  state_district: z.string().optional(),
  county: z.string().optional(),
  municipality: z.string().optional(),
  city: z.string().optional(),
  town: z.string().optional(),
  village: z.string().optional(),
  city_district: z.string().optional(),
  district: z.string().optional(),
  borough: z.string().optional(),
  suburb: z.string().optional(),
  subdivision: z.string().optional(),
  hamlet: z.string().optional(),
  croft: z.string().optional(),
  isolated_dwelling: z.string().optional(),
  neighbourhood: z.string().optional(),
  allotments: z.string().optional(),
  quarter: z.string().optional(),
  city_block: z.string().optional(),
  residental: z.string().optional(),
  farm: z.string().optional(),
  farmyard: z.string().optional(),
  industrial: z.string().optional(),
  commercial: z.string().optional(),
  retail: z.string().optional(),
  road: z.string().optional(),
  house_number: z.string().optional(),
  house_name: z.string().optional(),
  emergency: z.string().optional(),
  historic: z.string().optional(),
  military: z.string().optional(),
  natural: z.string().optional(),
  landuse: z.string().optional(),
  place: z.string().optional(),
  railway: z.string().optional(),
  man_made: z.string().optional(),
  aerialway: z.string().optional(),
  boundary: z.string().optional(),
  amenity: z.string().optional(),
  aeroway: z.string().optional(),
  club: z.string().optional(),
  craft: z.string().optional(),
  leisure: z.string().optional(),
  office: z.string().optional(),
  mountain_pass: z.string().optional(),
  shop: z.string().optional(),
  tourism: z.string().optional(),
  bridge: z.string().optional(),
  tunnel: z.string().optional(),
  waterway: z.string().optional(),
});

export const copyTypeSchema = z.object({
  html: z.string(),
  plaintext: z.string(),
});

export const staticPageSchema = baseRecordSchema.extend({
  fields: z.object({
    Slug: z.string().optional(),
    Title: z.string(),
    Summary: z.string().optional(),
    Body: z.string(),
    Public: z.literal(true),
  }),
  body: copyTypeSchema,
});

export const menuItemSchema = baseRecordSchema.extend({
  fields: z.object({
    label: z.string(),
    url: z.string(),
    placement: z.array(z.union([z.literal("Header"), z.literal("Footer")])),
  }),
});

export const airtableCDNMapSchema = z.object({
  filename: z.string(),
  filetype: z.string(),
  airtableDocID: z.string(),
  originalURL: z.string(),
  originalWidth: z.number().optional(),
  originalHeight: z.number().optional(),
  thumbnailURL: z.string().optional(),
  thumbnailWidth: z.number().optional(),
  thumbnailHeight: z.number().optional(),
});

export const formattedRecordWithCDNMapSchema = baseRecordWithSyncedCDNMapSchema.extend(
  {
    cdnMap: z.array(airtableCDNMapSchema),
  }
);

export const thumbnailsSchema = z.object({
  small: thumbnailSchema,
  large: thumbnailSchema,
  full: thumbnailSchema.optional(),
});

export const openStreetMapReverseGeocodeResponseSchema = z.object({
  place_id: z.number(),
  licence: z.string(),
  osm_type: z.string(),
  osm_id: z.number(),
  lat: z.string(),
  lon: z.string(),
  place_rank: z.number(),
  category: z.string(),
  type: z.string(),
  importance: z.number(),
  addresstype: z.string().optional(),
  name: z.string().optional(),
  display_name: z.string(),
  address: addressSchema.optional(),
  boundingbox: z.array(z.string()),
});

export const geographySchema = z.object({
  country: z.array(
    z.object({
      name: z.string(),
      emoji: countryEmojiSchema,
      iso3166: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    })
  ),
  location: openStreetMapReverseGeocodeResponseSchema.optional(),
});

export const attachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  size: z.number(),
  type: z.string(),
  thumbnails: thumbnailsSchema,
});

export const solidarityActionAirtableRecordSchema = baseRecordWithSyncedCDNMapSchema.extend(
  {
    fields: z
      .object({
        slug: z.string().optional(),
        Name: z.string().optional(),
        Location: z.string().optional(),
        Summary: z.string().optional(),
        Date: z.string().optional(),
        LastModified: z.string().optional(),
        Link: z.string().optional(),
        LocationData: z.string().optional(),
        Country: z.array(z.string()).optional(),
        countryName: z.array(z.string()).optional(),
        companyName: z.array(z.string()).optional(),
        organisingGroupName: z.array(z.string()).optional(),
        countryCode: z.array(z.string()).optional(),
        countrySlug: z.array(z.string()).optional(),
        Company: z.array(z.string()).optional(),
        "Organising Groups": z.array(z.string()).optional(),
        Category: z.array(z.string()).optional(),
        CategoryName: z.array(z.string()).optional(),
        CategoryEmoji: z.array(z.string()).optional(),
        Document: z.array(attachmentSchema).optional(),
        DisplayStyle: z.literal("Featured").optional().nullable(),
        hasPassedValidation: z.boolean().optional(),
        Public: z.boolean().optional(),
      })
      .and(baseRecordWithSyncedCDNMapSchema.shape.fields),
  }
);

export const solidarityActionSchema = solidarityActionAirtableRecordSchema
  .and(formattedRecordWithCDNMapSchema)
  .and(
    z.object({
      geography: geographySchema,
      summary: copyTypeSchema,
      slug: z.string(),
      fields: solidarityActionAirtableRecordSchema.shape.fields.and(
        z.object({
          Name: z.string(),
          Date: z.string(),
          Public: z.literal(true),
          LastModified: z.string(),
          hasPassedValidation: z.literal(true),
        })
      ),
    })
  );

export const blogPostAirtableRecordSchema = baseRecordWithSyncedCDNMapSchema.extend(
  {
    fields: z
      .object({
        Slug: z.string().optional(),
        ByLine: z.string().optional(),
        Title: z.string(),
        Image: z.array(attachmentSchema).optional(),
        Summary: z.string().optional(),
        Body: z.string(),
        Date: z.string(),
        Public: z.literal(true),
      })
      .and(baseRecordWithSyncedCDNMapSchema.shape.fields),
    body: copyTypeSchema,
  }
);

export const blogPostSchema = formattedRecordWithCDNMapSchema.and(
  blogPostAirtableRecordSchema
);

export const organisingGroupSchema = baseRecordSchema.extend({
  geography: geographySchema.pick({ country: true }),
  slug: z.string(),
  solidarityActions: z.array(solidarityActionSchema).optional(),
  fields: z.object({
    slug: z.string().optional(),
    Name: z.string(),
    "Full Name": z.string().optional(),
    Country: z.array(z.string()).optional(),
    countryName: z.array(z.string()).optional(),
    countryCode: z.array(z.string()).optional(),
    IsUnion: z.boolean().optional(),
    Website: z.string().optional(),
    Bluesky: z.string().optional(),
    Twitter: z.string().optional(),
    "Solidarity Actions": z.array(z.string()).optional(),
    LastModified: z.string(),
  }),
});

export const companySchema = baseRecordSchema.extend({
  fields: z.object({
    Name: z.string(),
    Summary: z.string().optional(),
    "Solidarity Actions": z.array(z.string()).optional(),
  }),
  solidarityActions: z.array(solidarityActionSchema).optional(),
  summary: copyTypeSchema,
});

export const categorySchema = baseRecordSchema.extend({
  fields: z.object({
    Name: z.string(),
    Emoji: z.string(),
    Summary: z.string().optional(),
    "Solidarity Actions": z.array(z.string()).optional(),
  }),
  solidarityActions: z.array(solidarityActionSchema).optional(),
  summary: copyTypeSchema,
});

export const countrySchema = baseRecordSchema.extend({
  emoji: countryEmojiSchema,
  fields: z.object({
    Name: z.string(),
    countryCode: z.string(),
    Summary: z.string().optional(),
    Slug: z.string(),
    Unions: z.array(z.string()).optional(),
    unionNames: z.array(z.string()).optional(),
    "Solidarity Actions": z.array(z.string()).optional(),
  }),
  solidarityActions: z.array(solidarityActionSchema).optional(),
  organisingGroups: z.array(organisingGroupSchema).optional(),
  summary: copyTypeSchema,
});
