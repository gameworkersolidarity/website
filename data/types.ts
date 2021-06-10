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
  full: Full;
}

export interface Full {
  url:    string;
  width:  number;
  height: number;
}

//////////////
// Domain data

export type Category = string
// "collective bargaining" |
// "demonstration" |
// "meeting" |
// "open letter" |
// "strike" |
// "union" |
// "worker organising"

export interface SolidarityAction extends BaseRecord {
  _coordinates?: { latitude: number, longitude: number }
  fields: {
    Name:       string;
    Location?:  string;
    Summary?:   string;
    Date:       string;
    LastModified: string;
    Link?:      string;
    Country:    string;
    Category?:  Category[],
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