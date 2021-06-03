namespace SolidarityAction {
  interface Record {
    id:          string;
    fields:      Fields;
    createdTime: Date;
  }

  interface Fields {
    Name:       string;
    Location?:  string;
    Summary?:   string;
    Date:       Date;
    Link?:      string;
    Country:    string;
    "Added by": AddedBy;
    Category?:  Category[];
    Document?:  Document[];
    Notes?:     string;
  }

  enum AddedBy {
    Jamie = "Jamie",
    Michelle = "Michelle",
  }

  enum Category {
    CollectiveBargaining = "collective bargaining",
    Demonstration = "demonstration",
    Meeting = "meeting",
    OpenLetter = "open letter",
    Strike = "strike",
    Union = "union",
    WorkerOrganising = "worker organising",
  }

  interface Document {
    id:         string;
    url:        string;
    filename:   string;
    size:       number;
    type:       string;
    thumbnails: Thumbnails;
  }

  interface Thumbnails {
    small: Full;
    large: Full;
    full?: Full;
  }

  interface Full {
    url:    string;
    width:  number;
    height: number;
  }
}