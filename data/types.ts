///////////
// Airtable

export interface BaseRecord {
  id: string;
  createdTime: string;
}

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails: Thumbnails;
}

export interface Thumbnails {
  small: Thumbnail;
  large: Thumbnail;
  full?: Thumbnail;
}

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

////// Package and third party

/**
 * From the "country-flag-emoji" npm package
 */
export interface CountryEmoji {
  code: string,
  unicode: string
  name: string
  emoji: string
}

export interface OpenStreetMapReverseGeocodeResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  place_rank: number;
  category: string;
  type: string;
  importance: number;
  addresstype?: string;
  name?: string;
  display_name: string;
  address?: Address;
  boundingbox: string[];
}

export interface Address {
  continent?: string

  country?: string
  country_code?: string

  region?: string
  state?: string
  state_district?: string
  county?: string

  municipality?: string
  city?: string
  town?: string
  village?: string

  city_district?: string
  district?: string
  borough?: string
  suburb?: string
  subdivision?: string

  hamlet?: string
  croft?: string
  isolated_dwelling?: string

  neighbourhood?: string
  allotments?: string
  quarter?: string

  city_block?: string
  residental?: string
  farm?: string
  farmyard?: string
  industrial?: string
  commercial?: string
  retail?: string

  road?: string

  house_number?: string
  house_name?: string

  emergency?: string
  historic?: string
  military?: string
  natural?: string
  landuse?: string
  place?: string
  railway?: string
  man_made?: string
  aerialway?: string
  boundary?: string
  amenity?: string
  aeroway?: string
  club?: string
  craft?: string
  leisure?: string
  office?: string
  mountain_pass?: string
  shop?: string
  tourism?: string
  bridge?: string
  tunnel?: string
  waterway?: string
}

//////////////
// Domain data

export type CopyType = {
  html: string
  plaintext: string
}

export type Geography = {
  country: Array<{
    name: string
    emoji: CountryEmoji
    iso3166: string
    latitude: number,
    longitude: number
    bbox: [number, number, number, number]
  }>,
  location?: OpenStreetMapReverseGeocodeResponse
}


export interface SolidarityActionAirtableRecord extends BaseRecord {
  fields: {
    slug?: string
    Name?: string;
    Location?: string;
    Summary?: string;
    Date?: string;
    LastModified?: string;
    Link?: string;
    LocationData?: string; // OpenStreetMapReverseGeocodeResponse;
    Country?: string[]
    'countryName'?: string[]
    companyName?: string[]
    organisingGroupName?: string[]
    'countryCode'?: string[]
    'countrySlug'?: string[]
    'Company'?: string[],
    'Organising Groups'?: string[]
    Category?: string[],
    CategoryName?: string[],
    CategoryEmoji?: string[],
    Document?: Attachment[];
    DisplayStyle?: "Featured" | null
    hasPassedValidation?: boolean,
    Public?: boolean
  },
}

export interface SolidarityActionAirtableRecord extends BaseRecord {
  fields: {
    slug?: string
    Name?: string;
    Location?: string;
    Summary?: string;
    Date?: string;
    LastModified?: string;
    Link?: string;
    LocationData?: string; // OpenStreetMapReverseGeocodeResponse;
    Country?: string[]
    'countryName'?: string[]
    companyName?: string[]
    organisingGroupName?: string[]
    'countryCode'?: string[]
    'countrySlug'?: string[]
    'Company'?: string[],
    'Organising Groups'?: string[]
    Category?: string[],
    CategoryName?: string[],
    CategoryEmoji?: string[],
    Document?: Attachment[];
    DisplayStyle?: "Featured" | null
    hasPassedValidation?: boolean,
    Public?: boolean
  },
}

export type SolidarityAction = SolidarityActionAirtableRecord & {
  geography: Geography,
  summary: CopyType
  slug: string
  fields: SolidarityActionAirtableRecord['fields'] & {
    Name: string;
    Date: string;
    Public: true;
    LastModified: string;
    hasPassedValidation: true,
  }
}

export interface BlogPost extends BaseRecord {
  fields: {
    Slug?: string;
    ByLine?: string
    Title: string;
    readonly Image?: Attachment[];
    Summary?: string;
    Body: string;
    Date: string;
    Public: true; // We can't accept records that haven't been marked for publication
  },
  body: CopyType
}

export interface StaticPage extends BaseRecord {
  fields: {
    Slug?: string;
    Title: string;
    Summary?: string;
    Body: string;
    Public: true; // We can't accept records that haven't been marked for publication
  },
  body: CopyType
}

export interface Country extends BaseRecord {
  emoji: CountryEmoji
  fields: {
    Name: string;
    countryCode: string;
    Summary?: string;
    Slug: string
    Unions?: string[]
    unionNames?: string[]
    // 'Official Name':   string;
    'Solidarity Actions'?: string[]
    // 'DisplayStyle (from Solidarity Actions)': string[]
    // 'Category (from Solidarity Actions)': string[]
    // 'Document (from Solidarity Actions)': Attachment[]
    // 'Date (from Solidarity Actions)': string[]
    // 'Name (from Solidarity Actions)': string[]
  }
  solidarityActions?: SolidarityAction[],
  organisingGroups?: OrganisingGroup[],
  summary: CopyType
}

export interface OrganisingGroup extends BaseRecord {
  geography: Pick<Geography, 'country'>
  slug: string
  solidarityActions?: SolidarityAction[]
  fields: {
    slug?: string
    Name: string
    'Full Name'?: string
    Country?: string[]
    countryName?: string[]
    countryCode?: string[]
    IsUnion?: boolean
    Website?: string
    Twitter?: string
    // 'Official Name':   string;
    'Solidarity Actions'?: string[]
    LastModified: string
    // 'DisplayStyle (from Solidarity Actions)': string[]
    // 'Category (from Solidarity Actions)': string[]
    // 'Document (from Solidarity Actions)': Attachment[]
    // 'Date (from Solidarity Actions)': string[]
    // 'Name (from Solidarity Actions)': string[]
  }
}

export interface Company extends BaseRecord {
  fields: {
    Name: string;
    Summary?: string;
    // 'Official Name':   string;
    'Solidarity Actions'?: string[]
    // 'DisplayStyle (from Solidarity Actions)': string[]
    // 'Category (from Solidarity Actions)': string[]
    // 'Document (from Solidarity Actions)': Attachment[]
    // 'Date (from Solidarity Actions)': string[]
    // 'Name (from Solidarity Actions)': string[]
  }
  solidarityActions?: SolidarityAction[],
  summary: CopyType
}

export interface Category extends BaseRecord {
  fields: {
    Name: string;
    Emoji: string;
    Summary?: string;
    // 'Official Name':   string;
    'Solidarity Actions'?: string[]
    // 'DisplayStyle (from Solidarity Actions)': string[]
    // 'Category (from Solidarity Actions)': string[]
    // 'Document (from Solidarity Actions)': Attachment[]
    // 'Date (from Solidarity Actions)': string[]
    // 'Name (from Solidarity Actions)': string[]
  }
  solidarityActions?: SolidarityAction[],
  summary: CopyType
}

export interface MenuItem extends BaseRecord {
  fields: {
    label: string;
    url: string;
    placement: Array<'Header' | 'Footer'>;
  }
}