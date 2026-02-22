export interface Collection {
  name: string;
  type: "want_to_go" | "starred" | "favorites" | "custom";
  count: number;
  visibility: string;
}

export interface Place {
  name: string;
  url: string;
  status: string;
  category: string;
  note: string;
}

export enum ErrorCode {
  AUTH_REQUIRED = "AUTH_REQUIRED",
  SIDEBAR_NOT_FOUND = "SIDEBAR_NOT_FOUND",
  COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
  PARSE_ERROR = "PARSE_ERROR",
  STATUS_MISSING = "STATUS_MISSING",
  CATEGORY_MISSING = "CATEGORY_MISSING",
  DATA_INCONSISTENCY = "DATA_INCONSISTENCY",
  WRONG_DOMAIN = "WRONG_DOMAIN"
}
