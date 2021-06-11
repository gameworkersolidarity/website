///////////
// Airtable

export interface BaseRecord {
  id: string;
  createdTime: string;
}

export interface Document {
  id:         string;
  url:        string;
  filename:   string;
  size:       number;
  type:       string;
  thumbnails: Thumbnails;
}

export interface Thumbnails {
  small: Full;
  large: Full;
  full?: Full;
}

export interface Full {
  url:    string;
  width:  number;
  height: number;
}

//////////////
// Domain data
export interface SolidarityAction extends BaseRecord {
  geography?: {
    country: {
      iso3166: string
      latitude: number,
      longitude: number
    }
  },
  fields: {
    Name:       string;
    Location?:  string;
    Summary?:   string;
    Date:       string;
    LastModified: string;
    Link?:      string;
    'Country': string[]
    'Country Name': string[]
    'Country Code': string[]
    'Country Slug': string[]
    Category?:  string[],
    Document?:  Document[];
    DisplayStyle?: "Featured" | null
    Notes?:     string;
    Public:     true; // We can't accept records that haven't been marked for publication
  }
}

export interface BlogPost extends BaseRecord {
  fields: {
    Slug?: string;
    Title:       string;
    Summary:   string;
    Body:   string;
    Date:       string;
    Public:     true; // We can't accept records that haven't been marked for publication
  }
}

export interface StaticPage extends BaseRecord {
  fields: {
    Slug?: string;
    Title:       string;
    Summary:   string;
    Body:   string;
    Link?: string;
    Public:     true; // We can't accept records that haven't been marked for publication
  }
}

export interface Country extends BaseRecord {
  emoji?: {
   code: string,
   unicode: string
   name: string
   emoji: string
  }
  fields: {
    Name: string;
    'Country Code':       string;
    Notes?:   string;
    Slug: string
    'Official Name':   string;
    'Solidarity Actions': any[]
    'DisplayStyle (from Solidarity Actions)': any[]
    'Public (from Solidarity Actions)': any[]
    'Category (from Solidarity Actions)': any[]
    'Document (from Solidarity Actions)': any[]
    'Link (from Solidarity Actions)': any[]
    'Date (from Solidarity Actions)': any[]
    'Summary (from Solidarity Actions)': any[]
    'Location (from Solidarity Actions)': any[]
    'Name (from Solidarity Actions)': any[]
  }
  solidarityActions?: SolidarityAction[]
}